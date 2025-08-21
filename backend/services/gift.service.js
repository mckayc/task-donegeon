const giftRepository = require('../repositories/gift.repository');
const userRepository = require('../repositories/user.repository');
const assetRepository = require('../repositories/asset.repository');
const notificationRepository = require('../repositories/notification.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => giftRepository.findAll();

const create = async (data) => {
    const newGift = { ...data, id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    const saved = await giftRepository.create(newGift);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await giftRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await giftRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const send = async (senderId, recipientId, assetId, guildId) => {
    const sender = await userRepository.findById(senderId);
    const recipient = await userRepository.findById(recipientId);
    const asset = await assetRepository.findById(assetId);

    if (!sender || !recipient || !asset) return null;

    const itemIndex = sender.ownedAssetIds.indexOf(assetId);
    if (itemIndex === -1) return null;

    sender.ownedAssetIds.splice(itemIndex, 1);
    recipient.ownedAssetIds.push(assetId);
    
    await userRepository.update(sender.id, { ownedAssetIds: sender.ownedAssetIds });
    await userRepository.update(recipient.id, { ownedAssetIds: recipient.ownedAssetIds });

    const newGift = {
        id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId, recipientId, assetId, guildId,
        sentAt: new Date().toISOString(),
    };
    await giftRepository.create(newGift);

    const newNotification = {
        senderId,
        type: 'GiftReceived',
        message: `${sender.gameName} sent you a gift: "${asset.name}"!`,
        recipientUserIds: [recipientId],
        link: 'Collection',
        guildId,
    };
    await notificationRepository.create(newNotification);

    updateEmitter.emit('update');
    return true;
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    send,
};