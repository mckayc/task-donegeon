const { dataSource } = require('../data-source');
const { ScheduledEventEntity, MarketEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const eventRepo = dataSource.getRepository(ScheduledEventEntity);

const getAllEvents = async (req, res) => {
    const events = await eventRepo.find();
    res.json(events);
};

const createEvent = async (req, res) => {
    // Validation: For a 'MarketSale' event, check if the marketId in modifiers exists.
    const { modifiers, eventType } = req.body;
    if (eventType === 'MarketSale' && modifiers?.marketId) {
        const marketExists = await dataSource.getRepository(MarketEntity).findOneBy({ id: modifiers.marketId });
        if (!marketExists) {
            return res.status(400).json({ error: `Market with ID ${modifiers.marketId} not found.` });
        }
    }

    const newEvent = eventRepo.create({
        ...req.body,
        id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
    const saved = await eventRepo.save(updateTimestamps(newEvent, true));
    updateEmitter.emit('update');
    res.status(201).json(saved);
};

const updateEvent = async (req, res) => {
    const event = await eventRepo.findOneBy({ id: req.params.id });
    if (!event) return res.status(404).send('Scheduled event not found');
    
    // Validation can also be added here for updates.
    const { modifiers, eventType } = req.body;
     if (eventType === 'MarketSale' && modifiers?.marketId) {
        const marketExists = await dataSource.getRepository(MarketEntity).findOneBy({ id: modifiers.marketId });
        if (!marketExists) {
            return res.status(400).json({ error: `Market with ID ${modifiers.marketId} not found.` });
        }
    }

    eventRepo.merge(event, req.body);
    const saved = await eventRepo.save(updateTimestamps(event));
    updateEmitter.emit('update');
    res.json(saved);
};

const deleteEvent = async (req, res) => {
    // This endpoint handles deleting a single event by its ID from the URL parameters.
    const result = await eventRepo.delete(req.params.id);
    if (result.affected === 0) {
        return res.status(404).send('Scheduled event not found');
    }
    updateEmitter.emit('update');
    res.status(204).send();
};

module.exports = {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
};
