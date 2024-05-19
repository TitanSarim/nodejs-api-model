const express = require('express');
const bodyParser = require('body-parser');
const {sequelize, Op} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 > FIXED
 > @returns contract by id
 > MY URL "http://localhost:3001/contracts/2" My headers "profile_id: 1"
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');

    const id = req.params.id;

    console.log("req.profile", req.profile.id)

    const contract = await Contract.findOne({
        where: {
            id: id,
            [Op.or]: [
                { ClientId: req.profile.id },
                { ContractorId: req.profile.id }
            ]
        }
    });
    if (!contract) return res.status(404).end();

    const data = {
        contract: contract
    }
    res.json(data);
});

/*
 > Returns a list of contracts belonging to a user (client or contractor),
 > the list should only contain non terminated contracts.
 > MY URL "http://localhost:3001/contracts" My headers "profile_id: 4"
*/
app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                { ClientId: req.profile.id },
                { ContractorId: req.profile.id }
            ],
            status: {
                [Op.ne]: 'terminated'
            }
        }
    });
    res.json(contracts);
});

/**
 > Get all unpaid jobs for a user (either a client or contractor),
 > for active contracts only.
 > MY URL "http://localhost:3001/jobs/unpaid" My headers "profile_id: 7"
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get('models');
    const jobs = await Job.findAll({
        where: {
            [Op.and]: [
                { paid: null },
                { ContractId: req.profile.id }
            ]
        },
        include: [{
            model: Contract,
            where: {
                [Op.or]: [
                    { ClientId: req.profile.id },
                    { ContractorId: req.profile.id }
                ],
                [Op.not]:[
                    {status: 'terminated'}
                ]
            }
        }]
    });
    res.json(jobs);
});


/**
 > Pay for a job, a client can only pay if his balance >= the amount to pay.
 > The amount should be moved from the client's balance to the contractor balance.
 > MY URL "http://localhost:3001/jobs/1/pay" My headers "profile_id: 1"
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const { Job, Profile } = req.app.get('models');
    const job = await Job.findByPk(req.params.job_id);
    if (!job) return res.status(404).end();

    if (req.profile.type === 'client') {
        const client = await Profile.findByPk(req.profile.id);
        if (client.balance < job.amount) return res.status(400).send('Insufficient balance.');
    }

    await sequelize.transaction(async (t) => {
        if (req.profile.type === 'client') {
            await req.profile.decrement('balance', { by: job.amount, transaction: t });
        } else {
            const contractor = await Profile.findByPk(job.ContractorId);
            await contractor.increment('balance', { by: job.amount, transaction: t });
        }
        await job.update({ paid: true }, { transaction: t });
    });

    res.status(200).send('Payment successful.');
});


/**
 > Deposits money into the balance of a client,
 > a client can't deposit more than 25% his total of jobs to pay (at the deposit moment)
 > MY URL "http://localhost:3001/balances/deposit" My headers "profile_id: 2"
 */
app.post('/balances/deposit', getProfile, async (req, res) => {
    const {Job } = req.app.get('models');
    const { amount } = req.body;
    const client = req.profile;

    const totalJobsAmount = await Job.sum('price', {
        where: {
            ContractId: client.id,
            paid: null
        }
    });

    if (amount > totalJobsAmount * 0.25) {
        return res.status(400).send('Deposit amount exceeds 25% of total jobs amount.');
    }

    await client.increment('balance', { by: amount });

    res.status(200).send('Deposit successful.');
});

/**
 > Returns the profession that earned the most money (sum of jobs paid)
 > for any contractor that worked in the query time range.
 > MY URL "http://localhost:3001/admin/best-profession?start=2024-05-07 &end=2024-06-08 " 
 */
app.get('/admin/best-profession', async (req, res) => {
    let { start, end } = req.query;
    const { Job, Profile, Contract } = req.app.get('models');

    console.log("start", start)

    start = new Date(start);
    end = new Date(end);


    const professionStats = await Job.findAll({
        where: {
            createdAt: {
                [Op.between]: [start, end]
            },
            paid: true
        },
        include: [{
            model: Contract,
            include: [{
                model: Profile,
                as: 'Contractor',
                attributes: ['profession']
            }]
        }],
        attributes: [
            [sequelize.fn('sum', sequelize.col('price')), 'totalEarned']
        ],
        group: ['Contract.Contractor.profession'],
        order: [[sequelize.literal('totalEarned'), 'DESC']],
    });

    res.json(professionStats);
});


/**
 > Returns the clients that paid the most for jobs in the query time period.
 > Limit query parameter should be applied, default limit is 2.
 > MY URL "http://localhost:3001/admin/best-clients?start=2020-08-15 &end=2024-06-08" 
 */
app.get('/admin/best-clients', async (req, res) => {
    const { Profile, Job, Contract } = req.app.get('models');
    let { start, end, limit = 2 } = req.query;

    start = new Date(start);
    end = new Date(end);

    const bestClients = await Job.findAll({
        where: {
            paymentDate: {
                [Op.between]: [start, end]
            },
            paid: true
        },
        attributes: ['ContractId', [sequelize.fn('sum', sequelize.col('price')), 'totalPaid']],
        include: [{
            model: Contract,
            as: 'Contract',
            include: [{
                model: Profile,
                as: 'Client',
                attributes: ['id', 'firstName', 'lastName']
            }]
        }],
        group: ['ContractId'],
        order: [[sequelize.literal('totalPaid'), 'DESC']],
        limit: parseInt(limit)
    });

    res.json(bestClients);
});

module.exports = app;
