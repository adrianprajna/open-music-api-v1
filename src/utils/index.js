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
}, songs) => ({
  id,
  name,
  year,
  songs,
});

module.exports = { mapSongDetailDBToModel, mapAlbumDetailDBToModel };
