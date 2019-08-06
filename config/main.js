module.exports = {
  DATABASE_URL: 'mongodb://localhost/towachat-server',
  PORT: 5000,
  SECRET: 'towachat-server',
  DEFAULT_AVATAR_URL: "https://i.imgur.com/Dp9Ogph.png",
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_CHANNEL_NAME_LENGTH: 128,
  MAX_CHANNEL_DESCRIPTION_LENGTH: 512,
  MAX_MESSAGE_LENGTH: 1028,
  MAX_USERNAME_LENGTH: 32,
}
