import { defineAuth } from "@aws-amplify/backend";

/**
 * Identity Pool を有効化するための auth リソース
 * ログイン機能は使用しないが、allow.guest() に必要な
 * Cognito Identity Pool を作成するために定義
 */
export const auth = defineAuth({
	loginWith: {
		email: true,
	},
});
