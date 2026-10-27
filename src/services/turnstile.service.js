const secretKey = process.env.SECRET_KEY_CLOUD;

class TurnstileValidator {
	constructor(secretKey, timeout = 10000) {
		this.secretKey = secretKey;
		this.timeout = timeout;
	}

	async validate(token, remoteip, options = {}) {
		// Input validation
		if (!token || typeof token !== "string") {
			return { success: false, error: "Invalid token format" };
		}

		if (token.length > 2048) {
			return { success: false, error: "Token too long" };
		}

		// Prepare request
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const formData = new FormData();
			formData.append("secret", this.secretKey);
			formData.append("response", token);

			if (remoteip) {
				formData.append("remoteip", remoteip);
			}

			if (options.idempotencyKey) {
				formData.append("idempotency_key", options.idempotencyKey);
			}

			const response = await fetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					body: formData,
					signal: controller.signal,
				},
			);

			const result = await response.json();

			// Additional validation
			if (result.success) {
				if (
					options.expectedAction &&
					result.action !== options.expectedAction
				) {
					return {
						success: false,
						error: "Action mismatch",
						expected: options.expectedAction,
						received: result.action,
					};
				}

				if (
					options.expectedHostname &&
					result.hostname !== options.expectedHostname
				) {
					return {
						success: false,
						error: "Hostname mismatch",
						expected: options.expectedHostname,
						received: result.hostname,
					};
				}
			}

			return result;
		} catch (error) {
			if (error.name === "AbortError") {
				return { success: false, error: "Validation timeout" };
			}

			console.error("Turnstile validation error:", error);
			return { success: false, error: "Internal error" };
		} finally {
			clearTimeout(timeoutId);
		}
	}
}

export default TurnstileValidator;