
const updateTimestamps = (entity, isNew = false) => {
    const now = new Date().toISOString();
    if (isNew && !entity.createdAt) {
      entity.createdAt = now;
    }
    entity.updatedAt = now;
    return entity;
};

module.exports = { updateTimestamps };
