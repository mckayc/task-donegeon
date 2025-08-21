const bugReportService = require('../services/bugReport.service');

const getAllBugReports = async (req, res) => {
    const reports = await bugReportService.getAll();
    res.json(reports);
};

const createBugReport = async (req, res) => {
    const savedReport = await bugReportService.create(req.body);
    res.status(201).json(savedReport);
};

const updateBugReport = async (req, res) => {
    const updatedReport = await bugReportService.update(req.params.id, req.body);
    if (!updatedReport) return res.status(404).send('Bug report not found');
    res.json(updatedReport);
};

const deleteBugReports = async (req, res) => {
    await bugReportService.deleteMany(req.body.ids);
    res.status(204).send();
};

const importBugReports = async (req, res) => {
    const { reports, mode } = req.body;
    const importedReports = await bugReportService.importMany(reports, mode);
    res.status(201).json(importedReports);
};


module.exports = {
    getAllBugReports,
    createBugReport,
    updateBugReport,
    deleteBugReports,
    importBugReports,
};