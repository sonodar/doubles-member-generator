import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const VAPID_SUBJECT = `mailto:${process.env.ADMIN_EMAIL ?? "noreply@example.com"}`;

const ssm = new SSMClient({});

let vapidConfigured = false;

/**
 * VAPID 設定用の callback 型
 */
export type SetVapidDetailsFn = (subject: string, publicKey: string, privateKey: string) => void;

/**
 * VAPID を設定（初回のみ）
 * @param publicKey VAPID 公開鍵
 * @param privateKeyParam Parameter Store のパス
 * @param setVapidDetails VAPID 設定関数
 * @throws 設定に必要な値がない場合
 */
export async function setupVapidDetails(
	publicKey: string,
	privateKeyParam: string,
	setVapidDetails: SetVapidDetailsFn,
): Promise<void> {
	if (vapidConfigured) {
		return;
	}

	if (!publicKey || !privateKeyParam) {
		throw new Error("Missing VAPID configuration: publicKey or privateKeyParam is empty");
	}

	const result = await ssm.send(
		new GetParameterCommand({
			Name: privateKeyParam,
			WithDecryption: true,
		}),
	);

	const privateKey = result.Parameter?.Value;
	if (!privateKey) {
		throw new Error(`Failed to fetch VAPID private key from ${privateKeyParam}`);
	}

	setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
	vapidConfigured = true;
}
