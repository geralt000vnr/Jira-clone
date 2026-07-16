const fs = require('fs');
const path = require('path');
const Attachment = require('../models/Attachment');
const storage = require('../services/fileStorage/LocalDiskStorage'); // swap this line for S3Storage later
const ApiError = require('../utils/ApiError');
const { isProjectAdminForIssue } = require('../services/permissions');

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

// POST /api/issues/:issueId/attachments  (expects multer middleware upstream providing req.file)
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No file provided');
    if (req.file.size > MAX_SIZE_BYTES) throw new ApiError(400, 'File exceeds 15MB limit');

    const storageKey = await storage.save(req.file.buffer, req.file.originalname);

    const attachment = await Attachment.create({
      organizationId: req.user.organizationId,
      issueId: req.params.issueId,
      uploadedBy: req.user.id,
      originalName: req.file.originalname,
      storageKey,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    res.status(201).json({
      success: true,
      attachment: { ...attachment.toObject(), url: await storage.getUrl(storageKey) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:issueId/attachments
exports.listAttachments = async (req, res, next) => {
  try {
    const attachments = await Attachment.find({
      issueId: req.params.issueId,
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    const withUrls = await Promise.all(
      attachments.map(async (a) => ({ ...a.toObject(), url: await storage.getUrl(a.storageKey) }))
    );

    res.json({ success: true, attachments: withUrls });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/attachments/:id  — uploader, or a project admin, may delete
exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!attachment) throw new ApiError(404, 'Attachment not found');

    const isUploader = String(attachment.uploadedBy) === String(req.user.id);
    if (!isUploader) {
      const isAdmin = await isProjectAdminForIssue({
        issueId: attachment.issueId,
        organizationId: req.user.organizationId,
        userId: req.user.id,
      });
      if (!isAdmin) throw new ApiError(403, 'Only the uploader or a project admin can delete this attachment');
    }

    await storage.delete(attachment.storageKey);
    await attachment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/attachments/file/:storageKey  — serves the raw file (auth-gated, unlike a public static folder)
exports.serveFile = async (req, res, next) => {
  try {
    const attachment = await Attachment.findOne({
      storageKey: req.params.storageKey,
      organizationId: req.user.organizationId,
    });
    if (!attachment) throw new ApiError(404, 'File not found');

    const filePath = path.join(__dirname, '../../uploads', attachment.storageKey);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};
