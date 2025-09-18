const { dataSource } = require('../data-source');
const { AITutorSessionLogEntity } = require('../entities');

const getTutorSessionLog = async (completionId) => {
    const logRepo = dataSource.getRepository(AITutorSessionLogEntity);
    return await logRepo.findOne({
        where: { completion: { id: completionId } },
        relations: ['completion']
    });
};

module.exports = {
    getTutorSessionLog,
};
