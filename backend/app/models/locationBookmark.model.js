module.exports = (sequelize, DataTypes) => {
    const LocationBookmark = sequelize.define('location_bookmarks', {
        location_bookmark_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        location_id: { type: DataTypes.UUID, allowNull: false },
        custom_name: { type: DataTypes.STRING(255), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        is_favorite: { type: DataTypes.BOOLEAN, defaultValue: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        last_visited: { type: DataTypes.DATE, allowNull: true }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'location_id']
            }
        ]
    });

    return LocationBookmark;
};
