module.exports = (sequelize, DataTypes) => {
    const Bookmark = sequelize.define('bookmarks', {
        bookmark_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        poi_id: { type: DataTypes.UUID, allowNull: false },
        custom_name: { type: DataTypes.STRING(255), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        is_favorite: { type: DataTypes.BOOLEAN, defaultValue: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        last_visited: { type: DataTypes.DATE, allowNull: true }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'poi_id']
            }
        ]
    });
    return Bookmark;
}
