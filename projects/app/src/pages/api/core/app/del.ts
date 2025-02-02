import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoAppVersion } from '@fastgpt/service/core/app/version/schema';
import { NextAPI } from '@/service/middleware/entry';
import { MongoChatInputGuide } from '@fastgpt/service/core/chat/inputGuide/schema';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { appId } = req.query as { appId: string };

  if (!appId) {
    throw new Error('参数错误');
  }

  // 凭证校验
  await authApp({ req, authToken: true, appId, per: OwnerPermissionVal });

  // 删除对应的聊天
  await mongoSessionRun(async (session) => {
    await MongoChatItem.deleteMany(
      {
        appId
      },
      { session }
    );
    await MongoChat.deleteMany(
      {
        appId
      },
      { session }
    );
    // 删除分享链接
    await MongoOutLink.deleteMany(
      {
        appId
      },
      { session }
    );
    // delete version
    await MongoAppVersion.deleteMany(
      {
        appId
      },
      { session }
    );
    await MongoChatInputGuide.deleteMany(
      {
        appId
      },
      { session }
    );
    // delete app
    await MongoApp.deleteOne(
      {
        _id: appId
      },
      { session }
    );
  });
}

export default NextAPI(handler);
