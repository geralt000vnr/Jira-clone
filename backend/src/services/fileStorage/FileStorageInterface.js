// Any storage backend (local disk, S3, etc.) must implement this interface.
// Swapping storage later is a config change, not a rewrite of controller code.
class FileStorageInterface {
  async save(fileBuffer, originalName) { throw new Error('Not implemented'); }
  async getUrl(storageKey) { throw new Error('Not implemented'); }
  async delete(storageKey) { throw new Error('Not implemented'); }
}
module.exports = FileStorageInterface;
