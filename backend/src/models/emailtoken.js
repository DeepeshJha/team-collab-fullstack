const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class EmailToken extends Model {
        static associate(models) {
            // EmailToken belongs to one User
            EmailToken.belongsTo(models.User, { 
                foreignKey: 'userId', 
                as: 'user' 
            });
        }

        static createToken(userId, token, type, expiresAt) {
            return this.create({
                userId,
                token,
                type,
                expiresAt
            });
        }

        static updateToken(token, expiresAt, type) {
            this.token = token;
            this.expiresAt = expiresAt;
            this.type = type;  // Must provide type: 'verification' or 'password_reset'
            return this.save();
        }
    }

    EmailToken.init(
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'Foreign key linking this token to a user'
        },
        token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [32, 255],
                notEmpty: true
            },
            comment: 'Random 32-character token sent in email link'
        },
        type: {
            type: DataTypes.ENUM('verification', 'password_reset'),
            allowNull: false,
            validate: {
                isIn: {
                    args: [['verification', 'password_reset']],
                    msg: 'Token type must be verification or password_reset'
                }
            },
            comment: 'Type of token: verification or password_reset'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: true
            },
            comment: 'Timestamp when this token becomes invalid'
        }
    }, {
        sequelize,
        modelName: 'EmailToken',
        tableName: 'emailtokens',
        timestamps: true,
        underscored: false,
        indexes: [
            { fields: ['userId'] },
            { fields: ['token'] },
            { fields: ['type'] },
            { fields: ['expiresAt'] }
        ]
    });

    return EmailToken;
};