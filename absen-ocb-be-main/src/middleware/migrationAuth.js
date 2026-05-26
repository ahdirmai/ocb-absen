module.exports = (req, res, next) => {
  if (req.headers['x-migration-key'] !== process.env.MIGRATION_API_KEY)
    return res.status(401).json({ message: 'Unauthorized' });
  next();
};
