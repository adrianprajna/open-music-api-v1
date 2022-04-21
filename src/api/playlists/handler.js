const { responseError } = require('../../utils/response');

class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistsHandler = this.deletePlaylistsHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getPlaylistSongHandler = this.getPlaylistSongHandler.bind(this);
    this.deleteSongFromPlaylistHandler = this.deleteSongFromPlaylistHandler.bind(this);
    this.getPlaylistActivitiesHandler = this.getPlaylistActivitiesHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    try {
      this._validator.validatePlaylistPayload(request.payload);
      const { name } = request.payload;

      const { id: owner } = request.auth.credentials;

      const playlistId = await this._playlistsService.addPlaylist({ name, owner });

      const response = h.response({
        status: 'success',
        data: {
          playlistId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return responseError(error, h);
    }
  }

  async getPlaylistsHandler(request) {
    const { id: owner } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(owner);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistsHandler(request, h) {
    try {
      const { id } = request.params;
      const { id: owner } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(id, owner);
      await this._playlistsService.deletePlaylist(id);

      return {
        status: 'success',
        message: 'Playlist berhasil dihapus',
      };
    } catch (error) {
      return responseError(error, h);
    }
  }

  async postSongToPlaylistHandler(request, h) {
    try {
      this._validator.validatePlaylistSongPayload(request.payload);

      const { id: playlistId } = request.params;
      const { songId } = request.payload;

      const { id: owner } = request.auth.credentials;

      const action = 'add';

      await this._playlistsService.verifyPlaylistAccess(playlistId, owner);
      await this._songsService.getSongById(songId);
      await this._playlistsService.addSongToPlaylist(playlistId, songId);
      await this._playlistsService.addPlaylistActivity({
        playlistId, songId, owner, action,
      });

      const response = h.response({
        status: 'success',
        message: 'Musik berhasil ditambahkan ke playlist!',
      });
      response.code(201);
      return response;
    } catch (error) {
      return responseError(error, h);
    }
  }

  async getPlaylistSongHandler(request, h) {
    try {
      const { id: playlistId } = request.params;

      const { id: owner } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistAccess(playlistId, owner);

      let playlist = await this._playlistsService.getPlaylistById(playlistId);
      const songs = await this._songsService.getSongsByPlaylist(playlistId);

      playlist = {
        ...playlist,
        songs,
      };

      return {
        status: 'success',
        data: {
          playlist,
        },
      };
    } catch (error) {
      return responseError(error, h);
    }
  }

  async deleteSongFromPlaylistHandler(request, h) {
    try {
      this._validator.validateDeletePlaylistSongPayload(request.payload);
      const { id: playlistId } = request.params;
      const { songId } = request.payload;
      const { id: owner } = request.auth.credentials;

      const action = 'delete';

      await this._playlistsService.verifyPlaylistAccess(playlistId, owner);
      await this._songsService.getSongById(songId);
      await this._playlistsService.deleteSongFromPlaylist(playlistId, songId);
      await this._playlistsService.addPlaylistActivity({
        playlistId, songId, owner, action,
      });

      return {
        status: 'success',
        message: 'Musik berhasil dihapus dari playlist',
      };
    } catch (error) {
      return responseError(error, h);
    }
  }

  async getPlaylistActivitiesHandler(request, h) {
    try {
      const { id: playlistId } = request.params;

      const { id: owner } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(playlistId, owner);
      const activities = await this._playlistsService.getPlaylistActivities(playlistId);

      return {
        status: 'success',
        data: {
          playlistId,
          activities,
        },
      };
    } catch (error) {
      return responseError(error, h);
    }
  }
}

module.exports = PlaylistsHandler;
