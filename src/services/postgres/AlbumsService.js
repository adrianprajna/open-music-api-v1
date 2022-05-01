/* eslint-disable radix */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumDetailDBToModel } = require('../../utils/index');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, name, year, null],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    try {
      const result = await this._cacheService.get(`album:${id}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const getSongByAlbumQuery = {
        text: 'SELECT s.id, title, performer FROM albums a JOIN songs s ON a.id = s.album_id WHERE a.id = $1',
        values: [id],
      };

      const songResult = await this._pool.query(getSongByAlbumQuery);
      const mappedResult = mapAlbumDetailDBToModel(result.rows[0], songResult.rows);

      await this._cacheService.set(`album:${id}`, JSON.stringify(mappedResult));

      return mappedResult;
    }
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${id}`);
  }

  async editAlbumCover(id, cover) {
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/covers/${cover}`;
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui sampul dari album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${id}`);
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${id}`);
  }

  async likeAlbum(userId, albumId) {
    const id = `user_album_likes-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3)',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Album gagal disukai');
    }

    await this._cacheService.delete(`user-album-likes:${albumId}`);
  }

  async dislikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal batal disukai. Data tidak ditemukan');
    }

    await this._cacheService.delete(`user-album-likes:${albumId}`);
  }

  async checkLikes(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album belum disukai');
    }
  }

  async verifyLikes(userId, albumId) {
    try {
      await this.checkLikes(userId, albumId);
      await this.dislikeAlbum(userId, albumId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        try {
          await this.likeAlbum(userId, albumId);
        } catch {
          throw error;
        }
      }
    }
  }

  async getAlbumLikesCount(albumId) {
    try {
      const result = await this._cacheService.get(`user-album-likes:${albumId}`);
      return {
        type: 'cache',
        likes: parseInt(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`user-album-likes:${albumId}`, result.rowCount);

      return {
        type: 'server',
        likes: result.rowCount,
      };
    }
  }
}

module.exports = AlbumsService;
