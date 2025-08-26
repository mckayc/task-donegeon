const userRepository = require('../repositories/user.repository');
const guildRepository = require('../repositories/guild.repository');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const trophyRepository = require('../repositories/trophy.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { logAdminAction, updateTimestamps } = require('../utils/helpers');
const { dataSource } = require('../data-source');

const getAll = (options) => userRepository.findAll(options);

const create = async (userData, actorId) => {
    const conflict = await userRepository.findByUsernameOrEmail(userData.username, userData.email);
    if (conflict) return null;

    let savedUser;

    await dataSource.transaction(async manager => {
        const userRepo = manager.getRepository('User');
        const newUser = userRepo.create({
            ...userData,
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
            guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
        });
        savedUser = await userRepo.save(updateTimestamps(newUser, true));
        
        const defaultGuild = await manager.getRepository('Guild').findOne({ where: { isDefault: true }, relations: ['members'] });
        if (defaultGuild) {
            defaultGuild.members.push(savedUser);
            await manager.save(updateTimestamps(defaultGuild));
        }

        if (actorId) {
            await logAdminAction(manager, { actorId, title: 'Created User', note: `User: ${savedUser.gameName}`, icon: '👤', color: '#84cc16' });
        }
    });

    updateEmitter.emit('update');
    return savedUser;
};

const clone = async (id) => {
    const userToClone = await userRepository.findById(id);
    if (!userToClone) return null;

    const suffix = Date.now().toString().slice(-5);
    const newUserData = {
        ...userToClone,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        username: `${userToClone.username}${suffix}`,
        email: `clone_${suffix}_${userToClone.email}`,
        gameName: `${userToClone.gameName} (Copy)`,
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedAssetIds: [],
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    };
    
    const savedUser = await userRepository.create(newUserData);
    
    const defaultGuild = await guildRepository.findDefault();
    if (defaultGuild) {
        await guildRepository.addMember(defaultGuild.id, savedUser.id);
    }

    updateEmitter.emit('update');
    return savedUser;
};

const update = async (id, userData) => {
    const user = await userRepository.findById(id);
    if (!user) return { success: false, status: 404, message: 'User not found' };

    if (userData.username && userData.username !== user.username) {
        const conflict = await userRepository.findByUsername(userData.username);
        if (conflict) return { success: false, status: 409, message: 'Username already in use.' };
    }
    if (userData.email && userData.email !== user.email) {
        const conflict = await userRepository.findByEmail(userData.email);
        if (conflict) return { success: false, status: 409, message: 'Email already in use.' };
    }

    const saved = await userRepository.update(id, userData);
    updateEmitter.emit('update');
    return { success: true, user: saved };
};

const deleteMany = async (ids, actorId) => {
    if (ids.length > 0) {
        await dataSource.transaction(async manager => {
            await manager.getRepository('User').delete(ids);
            await logAdminAction(manager, { actorId, title: `Deleted ${ids.length} User(s)`, note: `IDs: ${ids.join(', ')}`, icon: '🗑️', color: '#ef4444' });
        });
        updateEmitter.emit('update');
    }
};

const adjust = async (adjustmentData) => {
    const user = await userRepository.findById(adjustmentData.userId);
    if (!user) return null;
    
    const newAdjustment = {
        ...adjustmentData,
        adjustedAt: new Date().toISOString()
    };
    const savedAdjustment = await adminAdjustmentRepository.create(newAdjustment);

    let newUserTrophy = null;
    if (adjustmentData.type === 'Trophy' && adjustmentData.trophyId) {
        const newTrophyData = {
            userId: user.id,
            trophyId: adjustmentData.trophyId,
            awardedAt: new Date().toISOString(),
            guildId: adjustmentData.guildId || null,
        };
        newUserTrophy = await trophyRepository.createUserTrophy(newTrophyData);
    } else {
        // Apply rewards/setbacks logic here...
    }

    const updatedUser = await userRepository.findById(user.id);
    updateEmitter.emit('update');
    return { updatedUser, newAdjustment: savedAdjustment, newUserTrophy };
};


module.exports = {
    getAll,
    create,
    clone,
    update,
    deleteMany,
    adjust,
};
