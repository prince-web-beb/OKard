import { env } from '$env/dynamic/public';
import {
  UserManager, WebStorageStateStore, type User,
} from 'oidc-client-ts';

let authManager:UserManager|null=null;

export function browserAuthConfigured(): boolean {
  if(typeof window==='undefined')return false;
  const issuer=env.PUBLIC_OKARD_OIDC_ISSUER?.trim() ?? '';
  const clientId=env.PUBLIC_OKARD_OIDC_CLIENT_ID?.trim() ?? '';
  const audience=env.PUBLIC_OKARD_OIDC_AUDIENCE?.trim() ?? '';
  try {
    const url=new URL(issuer);
    return url.protocol==='https:' && !url.username && !url.password &&
      Boolean(clientId && audience);
  } catch {return false;}
}
/** No client secret, custom password handling, or implicit OAuth grant. */
export function getBrowserAuthManager():UserManager {
  if(!browserAuthConfigured())throw new Error('Secure sign-in is not configured for this deployment.');
  if(authManager)return authManager;
  const authority=env.PUBLIC_OKARD_OIDC_ISSUER.trim().replace(/\/$/,'');
  const client_id=env.PUBLIC_OKARD_OIDC_CLIENT_ID.trim();
  const audience=env.PUBLIC_OKARD_OIDC_AUDIENCE.trim();
  authManager=new UserManager({
    authority,client_id,response_type:'code',scope:'openid profile',
    redirect_uri:window.location.origin+'/auth/callback',
    post_logout_redirect_uri:window.location.origin+'/account',
    userStore:new WebStorageStateStore({store:window.sessionStorage,
      prefix:'okard-oidc:user:'}),
    stateStore:new WebStorageStateStore({store:window.sessionStorage,
      prefix:'okard-oidc:state:'}),
    // OIDC servers such as Auth0 can honor an explicit audience. Other providers
    // must be configured to issue JWT access tokens for OKard's API audience.
    extraQueryParams:{audience},
    automaticSilentRenew:false,
    monitorSession:false,
    loadUserInfo:false,
    revokeTokensOnSignout:true,
  });
  return authManager;
}
export async function currentUser():Promise<User|null> {
  if(!browserAuthConfigured())return null;
  const user=await getBrowserAuthManager().getUser();
  return user && !user.expired && user.access_token ? user:null;
}
export async function getAccessToken():Promise<string> {
  const user=await currentUser();
  if(!user)throw new Error('Your sign-in has expired. Sign in again to access cloud projects.');
  return user.access_token;
}
