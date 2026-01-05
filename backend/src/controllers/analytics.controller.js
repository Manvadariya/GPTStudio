import mongoose from 'mongoose';
import { ApiCallLog } from '../models/ApiCallLog.model.js';

export const getAnalytics = async (req, res) => {
  const { range } = req.query; // '7d', '30d', '90d'
  const userId = req.user.id;

  let days = 7;
  if (range === '30d') days = 30;
  if (range === '90d') days = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const [summary, callsOverTime, projectBreakdown] = await Promise.all([
      // 1. Aggregation for Summary Cards
      ApiCallLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalApiCalls: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTimeMs' },
            totalTokensUsed: { $sum: '$tokensUsed' },
          }
        }
      ]),

      // 2. Aggregation for API Calls & Tokens Over Time (by day)
      ApiCallLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            calls: { $sum: 1 },
            tokens: { $sum: '$tokensUsed' }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', calls: 1, tokens: 1 } }
      ]),

      // 3. Aggregation for Project Usage Breakdown
      ApiCallLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
        { $group: { _id: '$projectId', calls: { $sum: 1 } } },
        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'projectDetails' } },
        { $unwind: '$projectDetails' },
        { $project: { _id: 0, name: '$projectDetails.name', calls: 1 } }
      ])
    ]);

    const summaryData = summary[0] || { totalApiCalls: 0, avgResponseTime: 0, totalTokensUsed: 0 };

    res.status(200).json({
      summary: {
        totalApiCalls: summaryData.totalApiCalls,
        avgResponseTime: Math.round(summaryData.avgResponseTime),
        totalTokensUsed: summaryData.totalTokensUsed,
      },
      callsOverTime,
      projectBreakdown
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: 'Server Error: Could not fetch analytics data.' });
  }
};