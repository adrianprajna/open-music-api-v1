const { responseError } = require('../../utils/response');

class ExportsHandler {
  constructor(producerService, playlistsService, validator) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    try {
      this._validator.validateExportPlaylistPayload(request.payload);
      const { id: owner } = request.auth.credentials;
      const { playlistId } = request.params;
      const { targetEmail } = request.payload;

      await this._playlistsService.verifyPlaylistOwner(playlistId, owner);
      const message = {
        playlistId,
        targetEmail,
      };

      await this._producerService.sendMessage('export:playlist', JSON.stringify(message));

      const response = h.response({
        status: 'success',
        message: 'Permintaan anda dalam antrean',
      });
      response.code(201);
      return response;
    } catch (error) {
      return responseError(error, h);
    }
  }
}

module.exports = ExportsHandler;
