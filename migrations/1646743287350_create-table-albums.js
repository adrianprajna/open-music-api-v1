exports.up = (pgm) => {
  pgm.createTable('albums', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'integer',
      notNull: true,
    },
    coverUrl: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('albums');
};
