const { responseError } = require('../../utils/response');

class UploadsHandler {
  constructor(storageService, albumsService, validator) {
    this._storageService = storageService;
    this._albumsService = albumsService;
    this._validator = validator;

    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
  }

  async postUploadCoverHandler(request, h) {
    try {
      const { cover } = request.payload;
      const { id } = request.params;
      console.log(cover);
      this._validator.validateImageHeaders(cover.hapi.headers);

      const coverUrl = await this._storageService.writeFile(cover, cover.hapi);
      await this._albumsService.editAlbumCover(id, coverUrl);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });
      response.code(201);
      return response;
    } catch (error) {
      return responseError(error, h);
    }
  }
}

module.exports = UploadsHandler;
