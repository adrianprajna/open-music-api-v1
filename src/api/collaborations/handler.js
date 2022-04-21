const { responseError } = require('../../utils/response');

class CollaborationsHandler {
  constructor(collaborationsService, playlistsService, validator) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    try {
      this._validator.validateCollaborationPayload(request.payload);
      const { id: owner } = request.auth.credentials;
      const { playlistId, userId } = request.payload;

      await this._playlistsService.verifyPlaylistOwner(playlistId, owner);
      const collaborationId = await this._collaborationsService.addCollaboration(
        playlistId, userId,
      );

      const response = h.response({
        status: 'success',
        data: {
          collaborationId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return responseError(error, h);
    }
  }

  async deleteCollaborationHandler(request, h) {
    try {
      this._validator.validateCollaborationPayload(request.payload);
      const { id: owner } = request.auth.credentials;
      const { playlistId, userId } = request.payload;

      await this._playlistsService.verifyPlaylistOwner(playlistId, owner);
      await this._collaborationsService.deleteCollaboration(playlistId, userId);

      return {
        status: 'success',
        message: 'Kolaborasi berhasil dihapus',
      };
    } catch (error) {
      return responseError(error, h);
    }
  }
}

module.exports = CollaborationsHandler;