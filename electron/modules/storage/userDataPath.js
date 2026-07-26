import path from 'node:path'

export const USER_DATA_DIRECTORY_NAME = '流放助手'

export const resolveUserDataPath = (appDataPath) => path.join(appDataPath, USER_DATA_DIRECTORY_NAME)
