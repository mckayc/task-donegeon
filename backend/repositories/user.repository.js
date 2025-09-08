const { dataSource } = require('../data-source');
const { UserEntity } = require('../entities');
const { Brackets, In } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(UserEntity);

const findAll = (options = {}) => {
    const { searchTerm, sortBy } = options;
    const qb = repo.createQueryBuilder("user");

    if (searchTerm) {
        qb.where(new Brackets(subQuery => {
            subQuery.where("LOWER(user.gameName) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` })
                  .orWhere("LOWER(user.username) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` });
        }));
    }

    switch (sortBy) {
        case 'gameName-desc': qb.orderBy("user.gameName", "DESC"); break;
        case 'username-asc': qb.orderBy("user.username", "ASC"); break;
        case 'username-desc': qb.orderBy("user.username", "DESC"); break;
        case 'role-asc': qb.orderBy("user.role", "ASC"); break;
        case 'role-desc': qb.orderBy("user.role", "DESC"); break;
        case 'gameName-asc': default: qb.orderBy("user.gameName", "ASC"); break;
    }

    return qb.getMany();
};

const findById = (id) => repo.findOneBy({ id });
const findByIds = (ids) => repo.findBy({ id: In(ids) });
const findByUsername = (username) => repo.findOneBy({ username });
const findByEmail = (email) => repo.findOneBy({ email });

const findByUsernameOrEmail = (username, email) => {
    return repo.findOne({
        where: [
            { username },
            { email }
        ]
    });
};

const countAdmins = () => {
    return repo.count({ where: { role: 'Donegeon Master' } });
};

const create = (userData) => {
    const newUser = repo.create(userData);
    return repo.save(updateTimestamps(newUser, true));
};

const update = async (id, userData) => {
    const user = await findById(id);
    if (!user) return null;
    repo.merge(user, userData);
    return repo.save(updateTimestamps(user));
};

const deleteMany = (ids) => repo.delete(ids);

module.exports = {
    findAll,
    findById,
    findByIds,
    findByUsername,
    findByEmail,
    findByUsernameOrEmail,
    countAdmins,
    create,
    update,
    deleteMany,
};