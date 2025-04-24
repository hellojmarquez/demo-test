import { Log } from '@/models/Log';
import dbConnect from '@/lib/dbConnect';


export const saveLog = async (message: string, level: 'info' | 'warning' | 'error' = 'info', metadata = {}) => {
  try {
    await dbConnect();
    await Log.create({ message, level, metadata });
  } catch (error) {
    console.error('Failed to save log:', error);
  }
};

export const getLogs = async (limit = 100) => {
  try {
    await dbConnect();
    return await Log.find({}).sort({ createdAt: -1 }).limit(limit);
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    return [];
  }
};
