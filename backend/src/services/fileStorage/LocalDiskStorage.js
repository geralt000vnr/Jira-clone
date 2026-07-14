const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const FileStorageInterface = require('./FileStorageInterface');

const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');

class LocalDiskStorage extends FileStorageInterface {
  async save(fileBuffer, originalName) {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const ext = path.extname(originalName);
    const storageKey = `${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(UPLOAD_ROOT, storageKey), fileBuffer);
    return storageKey;
  }

  async getUrl(storageKey) {
    // served via a static/authenticated route, e.g. /api/attachments/file/:storageKey
    return `/api/attachments/file/${storageKey}`;
  }

  async delete(storageKey) {
    await fs.unlink(path.join(UPLOAD_ROOT, storageKey)).catch(() => {});
  }
}

module.exports = new LocalDiskStorage();
