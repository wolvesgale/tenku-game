/**
 * Steam Web API ユーティリティ
 * 仕様書 §4.7 ゲームアカウント連携
 *
 * 必要な環境変数: STEAM_API_KEY
 * Steam APIキー取得: https://steamcommunity.com/dev/apikey
 */

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_KEY = process.env.STEAM_API_KEY ?? "";

export interface SteamProfile {
  steamId: string;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
  communityVisibilityState: number; // 3 = public
}

export interface SteamGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  iconUrl: string;
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description: string;
  iconUrl: string;
  globalPercent: number; // 全プレイヤー中の取得率（低い=レア）
  unlockedAt?: string;
}

/** SteamID64 の形式チェック（17桁数字） */
export function isValidSteamId(id: string): boolean {
  return /^\d{17}$/.test(id);
}

/** Steam プロフィール取得 */
export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${steamId}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) return null;

  return {
    steamId: player.steamid,
    nickname: player.personaname,
    avatarUrl: player.avatarfull,
    profileUrl: player.profileurl,
    communityVisibilityState: player.communityvisibilitystate,
  };
}

/** 所有ゲーム一覧 + 総プレイ時間 */
export async function getSteamGames(steamId: string): Promise<{
  games: SteamGame[];
  totalMinutes: number;
} | null> {
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = await res.json();
  const raw = data?.response?.games ?? [];

  const games: SteamGame[] = raw.map((g: any) => ({
    appId: g.appid,
    name: g.name ?? `App ${g.appid}`,
    playtimeMinutes: g.playtime_forever ?? 0,
    iconUrl: g.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
      : "",
  }));

  const totalMinutes = games.reduce((sum, g) => sum + g.playtimeMinutes, 0);
  return { games, totalMinutes };
}

/** 特定ゲームの実績 + グローバル取得率 */
export async function getSteamAchievements(
  steamId: string,
  appId: number
): Promise<SteamAchievement[]> {
  // ユーザーの取得済み実績
  const playerUrl = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_KEY}&steamid=${steamId}&appid=${appId}&l=japanese`;
  // グローバル取得率
  const globalUrl = `${STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;

  const [playerRes, globalRes] = await Promise.all([
    fetch(playerUrl, { next: { revalidate: 0 } }),
    fetch(globalUrl, { next: { revalidate: 0 } }),
  ]);

  if (!playerRes.ok) return [];

  const playerData = await playerRes.json();
  const achievements = playerData?.playerstats?.achievements ?? [];
  if (achievements.length === 0) return [];

  // グローバル取得率マップ
  const globalMap: Record<string, number> = {};
  if (globalRes.ok) {
    const globalData = await globalRes.json();
    for (const a of globalData?.achievementpercentages?.achievements ?? []) {
      globalMap[a.name] = a.percent;
    }
  }

  return achievements
    .filter((a: any) => a.achieved === 1)
    .map((a: any) => ({
      apiName: a.apiname,
      name: a.name ?? a.apiname,
      description: a.description ?? "",
      iconUrl: a.icon ?? "",
      globalPercent: globalMap[a.apiname] ?? 100,
      unlockedAt: a.unlocktime
        ? new Date(a.unlocktime * 1000).toISOString()
        : undefined,
    }))
    .sort((a: SteamAchievement, b: SteamAchievement) => a.globalPercent - b.globalPercent); // レア順
}

/** 複数ゲームのレア実績をまとめて取得（上位10件） */
export async function getTopRareAchievements(
  steamId: string,
  games: SteamGame[],
  limit = 10
): Promise<SteamAchievement[]> {
  // プレイ時間が多い上位5ゲームから実績を取得（API負荷軽減）
  const topGames = [...games]
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .slice(0, 5);

  const allAchievements: SteamAchievement[] = [];
  for (const game of topGames) {
    try {
      const achievements = await getSteamAchievements(steamId, game.appId);
      allAchievements.push(...achievements);
    } catch {
      // 実績非対応ゲームはスキップ
    }
  }

  // レア順（取得率低い順）で上位limit件
  return allAchievements
    .sort((a, b) => a.globalPercent - b.globalPercent)
    .slice(0, limit);
}
