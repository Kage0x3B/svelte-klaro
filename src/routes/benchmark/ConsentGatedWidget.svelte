<script lang="ts">
	let { timestamp }: { timestamp: string } = $props();
</script>

<div class="widget">
	<div class="widget-content">
		<span class="widget-icon">&#x2714;</span>
		<div>
			<strong>Analytics Widget</strong>
			<p>Consent granted — widget loaded at {timestamp}</p>
		</div>
	</div>
</div>

<style>
	.widget {
		margin-top: 16px;
		border: 2px solid #1a936f;
		border-radius: 8px;
		padding: 20px;
		max-width: 400px;
		background: #f0faf6;
	}

	.widget-content {
		display: flex;
		align-items: center;
		gap: 12px;
		color: #333;
	}

	.widget-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	p {
		margin: 4px 0 0;
		font-size: 13px;
	}
</style>
