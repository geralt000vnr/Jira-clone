const Comment = require('../models/Comment');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const { notifyIssueUpdate } = require('../services/notificationService');

// POST /api/issues/:issueId/comments
exports.createComment = async (req, res, next) => {
  try {
    const { body } = req.body;

    const issue = await Issue.findOne(req.scope({ _id: req.params.issueId }));
    if (!issue) throw new ApiError(404, 'Issue not found');

    const comment = await Comment.create({
      organizationId: req.user.organizationId,
      issueId: req.params.issueId,
      authorId: req.user.id,
      body,
    });

    const populated = await comment.populate('authorId', 'name avatarUrl');
    notifyIssueUpdate({ issue, event: 'comment_added', actorId: req.user.id });

    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:issueId/comments
exports.listComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({
      issueId: req.params.issueId,
      organizationId: req.user.organizationId,
      deletedAt: null,
    })
      .sort({ createdAt: 1 })
      .populate('authorId', 'name avatarUrl');
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/comments/:id  — only the original author may edit
exports.updateComment = async (req, res, next) => {
  try {
    const { body } = req.body;
    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId, authorId: req.user.id, deletedAt: null },
      { $set: { body } },
      { new: true }
    );
    if (!comment) throw new ApiError(403, 'Comment not found or you are not the author');
    res.json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id  — author, or a project admin, may delete (soft delete)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!comment) throw new ApiError(404, 'Comment not found');

    const isAuthor = String(comment.authorId) === String(req.user.id);
    if (!isAuthor) {
      throw new ApiError(403, 'Only the author can delete this comment');
    }

    comment.deletedAt = new Date();
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
