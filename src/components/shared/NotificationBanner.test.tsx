import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { NotificationBanner } from "./NotificationBanner";

describe("NotificationBanner", () => {
	describe("表示条件 (Requirements 1.1, 1.3, 1.4)", () => {
		it("status が permission-needed のとき、バナーが表示される", () => {
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={false}
					onSubscribe={vi.fn()}
					onDismiss={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("notification-banner")).toBeInTheDocument();
			expect(screen.getByText(/通知を受け取る/)).toBeInTheDocument();
		});

		it("status が ready のとき、バナーが表示される", () => {
			render(<NotificationBanner status="ready" isSubscribing={false} onSubscribe={vi.fn()} onDismiss={vi.fn()} />);

			expect(screen.getByTestId("notification-banner")).toBeInTheDocument();
		});

		it("status が subscribed のとき、バナーが表示されない", () => {
			render(
				<NotificationBanner status="subscribed" isSubscribing={false} onSubscribe={vi.fn()} onDismiss={vi.fn()} />,
			);

			expect(screen.queryByTestId("notification-banner")).not.toBeInTheDocument();
		});

		it("status が denied のとき、バナーが表示されない", () => {
			render(<NotificationBanner status="denied" isSubscribing={false} onSubscribe={vi.fn()} onDismiss={vi.fn()} />);

			expect(screen.queryByTestId("notification-banner")).not.toBeInTheDocument();
		});

		it("status が unsupported のとき、バナーが表示されない", () => {
			render(
				<NotificationBanner status="unsupported" isSubscribing={false} onSubscribe={vi.fn()} onDismiss={vi.fn()} />,
			);

			expect(screen.queryByTestId("notification-banner")).not.toBeInTheDocument();
		});

		it("status が registration-failed のとき、バナーが表示されない", () => {
			render(
				<NotificationBanner
					status="registration-failed"
					isSubscribing={false}
					onSubscribe={vi.fn()}
					onDismiss={vi.fn()}
				/>,
			);

			expect(screen.queryByTestId("notification-banner")).not.toBeInTheDocument();
		});
	});

	describe("ボタン操作 (Requirements 1.1, 1.3)", () => {
		it("「通知を受け取る」ボタンをクリックすると onSubscribe が呼ばれる", async () => {
			const onSubscribe = vi.fn();
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={false}
					onSubscribe={onSubscribe}
					onDismiss={vi.fn()}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: /通知を受け取る/ }));

			await waitFor(() => {
				expect(onSubscribe).toHaveBeenCalledTimes(1);
			});
		});

		it("「後で」ボタンをクリックすると onDismiss が呼ばれる", () => {
			const onDismiss = vi.fn();
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={false}
					onSubscribe={vi.fn()}
					onDismiss={onDismiss}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: /後で/ }));

			expect(onDismiss).toHaveBeenCalledTimes(1);
		});
	});

	describe("ローディング状態", () => {
		it("isSubscribing が true のとき、ボタンが無効化される", () => {
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={true}
					onSubscribe={vi.fn()}
					onDismiss={vi.fn()}
				/>,
			);

			expect(screen.getByRole("button", { name: /通知を受け取る/ })).toBeDisabled();
			expect(screen.getByRole("button", { name: /後で/ })).toBeDisabled();
		});

		it("isSubscribing が false のとき、ボタンが有効", () => {
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={false}
					onSubscribe={vi.fn()}
					onDismiss={vi.fn()}
				/>,
			);

			expect(screen.getByRole("button", { name: /通知を受け取る/ })).not.toBeDisabled();
			expect(screen.getByRole("button", { name: /後で/ })).not.toBeDisabled();
		});
	});

	describe("UI 要素", () => {
		it("適切なメッセージが表示される", () => {
			render(
				<NotificationBanner
					status="permission-needed"
					isSubscribing={false}
					onSubscribe={vi.fn()}
					onDismiss={vi.fn()}
				/>,
			);

			expect(screen.getByText(/組み合わせが決定したら通知/)).toBeInTheDocument();
		});
	});
});
