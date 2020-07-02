module.exports = {
    ServerPort : process.env["PORT"] || 3000,
    DataBaseUrl :process.env["DATABASE_URL"] || 'mongodb://localhost:27017/sample'
}