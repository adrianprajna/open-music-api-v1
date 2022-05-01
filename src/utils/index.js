const mapSongDetailDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapAlbumDetailDBToModel = ({
  id,
  name,
  year,
  cover,
}, songs) => ({
  id,
  name,
  year,
  coverUrl: cover,
  songs,
});

module.exports = { mapSongDetailDBToModel, mapAlbumDetailDBToModel };
