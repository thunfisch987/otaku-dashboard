<template>
	<ClientOnly>
		<button
			type="button"
			role="switch"
			aria-label="Dark mode"
			:aria-checked="isDark"
			class="aspect-[5/3] h-11 shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-12"
			:class="isDark ? 'is-dark' : 'is-light'"
			@click="isDark = !isDark"
		>
			<!--
				Geometry comes straight from the Figma frame (100x60 units): the
				thumb slides 40 units while the sun and moon trade places behind
				the track, 100 units apart vertically, clipped by the pill.
			-->
			<svg
				class="block h-full w-full"
				viewBox="0 0 100 60"
				aria-hidden="true"
			>
				<defs>
					<clipPath :id="clipId">
						<rect
							width="100"
							height="60"
							rx="32"
						/>
					</clipPath>
				</defs>
				<g :clip-path="`url(#${clipId})`">
					<rect
						class="track"
						width="100"
						height="60"
						rx="32"
					/>

					<g class="sun">
						<circle
							cx="23.8"
							cy="23.5"
							r="18.5"
						/>
						<g class="rays">
							<line
								x1="44.2"
								y1="23.5"
								x2="47"
								y2="23.5"
							/>
							<line
								x1="38.2"
								y1="37.9"
								x2="40.2"
								y2="39.9"
							/>
							<line
								x1="23.8"
								y1="43.9"
								x2="23.8"
								y2="46.7"
							/>
							<line
								x1="9.4"
								y1="37.9"
								x2="7.4"
								y2="39.9"
							/>
							<line
								x1="3.4"
								y1="23.5"
								x2="0.6"
								y2="23.5"
							/>
							<line
								x1="9.4"
								y1="9.1"
								x2="7.4"
								y2="7.1"
							/>
							<line
								x1="23.8"
								y1="3.1"
								x2="23.8"
								y2="0.3"
							/>
							<line
								x1="38.2"
								y1="9.1"
								x2="40.2"
								y2="7.1"
							/>
						</g>
					</g>

					<g class="moon">
						<ellipse
							cx="20.9"
							cy="41"
							rx="20.9"
							ry="21"
						/>
						<path
							d="M36.053 0.79684L37.931 4.72711L42.2337 4.14816L39.0916 7.15615L40.9695 11.0864L37.1497 9.01518L34.0076 12.0232L34.7889 7.73509L30.969 5.66386L35.2717 5.08491L36.053 0.79684Z"
						/>
						<path
							d="M44.3017 16.03L44.1094 18.9297L46.7963 20.0095L43.9905 20.7219L43.7981 23.6216L42.2564 21.1621L39.4506 21.8745L41.3036 19.6421L39.7618 17.1826L42.4488 18.2624L44.3017 16.03Z"
						/>
						<path
							d="M25.327 6.07381L25.2552 8.97908L27.9846 9.94545L25.2108 10.7746L25.139 13.6799L23.4965 11.2871L20.7227 12.1163L22.4814 9.80827L20.8389 7.41546L23.5683 8.38183L25.327 6.07381Z"
						/>
					</g>

					<circle
						class="thumb"
						cx="30"
						cy="30"
						r="20"
					/>
				</g>
			</svg>
		</button>
		<template #fallback>
			<div
				class="aspect-[5/3] h-11 shrink-0 rounded-full bg-elevated sm:h-12"
			/>
		</template>
	</ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

const clipId = useId() ?? 'color-mode-switch-clip';

// Rendered inside `ClientOnly`, so the resolved mode is always available here.
const isDark = computed({
	get: () => colorMode.value === 'dark',
	set: (value: boolean) => {
		colorMode.preference = value ? 'dark' : 'light';
	},
});
</script>

<style scoped>
/* Design tokens from the Figma frame; the track is a fixed pair of brand
   colors rather than a theme token, so it stays correct in both modes. */
.track {
	fill: #ff6948;
	transition: fill 300ms ease;
}

.is-dark .track {
	fill: #324ac6;
}

.sun circle {
	fill: #ffc633;
}

.rays {
	stroke: #ffc633;
	stroke-width: 2.6;
	stroke-linecap: round;
}

.moon ellipse,
.moon path {
	fill: #ffcf24;
}

.thumb {
	fill: #ffffff;
}

/*
 * Spring curves sampled from a damped oscillator, so both the thumb and the
 * sun/moon settle with the overshoot the design's microinteraction uses. The
 * cubic-bezier line is the fallback for browsers without `linear()`.
 */
.thumb {
	transition: transform 620ms cubic-bezier(0.34, 1.56, 0.64, 1);
	transition-timing-function: linear(
		0,
		0.035 2.94%,
		0.1271 5.88%,
		0.2577 8.82%,
		0.4096 11.76%,
		0.5679 14.71%,
		0.7206 17.65%,
		0.8586 20.59%,
		0.9759 23.53%,
		1.0691 26.47%,
		1.1373 29.41%,
		1.1814 32.35%,
		1.2036 35.29%,
		1.2073 38.24%,
		1.1962 41.18%,
		1.1744 44.12%,
		1.1456 47.06%,
		1.1134 50%,
		1.0806 52.94%,
		1.0496 55.88%,
		1.022 58.82%,
		0.999 61.76%,
		0.9811 64.71%,
		0.9684 67.65%,
		0.9606 70.59%,
		0.9571 73.53%,
		0.9573 76.47%,
		0.9603 79.41%,
		0.9653 82.35%,
		0.9716 85.29%,
		0.9784 88.24%,
		0.9851 91.18%,
		0.9914 94.12%,
		0.9969 97.06%,
		1.0014 100%
	);
}

.sun,
.moon {
	transition: transform 720ms cubic-bezier(0.34, 1.4, 0.64, 1);
	transition-timing-function: linear(
		0,
		0.0469 3.33%,
		0.1632 6.67%,
		0.3172 10%,
		0.4834 13.33%,
		0.6434 16.67%,
		0.785 20%,
		0.9015 23.33%,
		0.9904 26.67%,
		1.0524 30%,
		1.0905 33.33%,
		1.1087 36.67%,
		1.1117 40%,
		1.1039 43.33%,
		1.0893 46.67%,
		1.0714 50%,
		1.0528 53.33%,
		1.0353 56.67%,
		1.0202 60%,
		1.008 63.33%,
		0.9989 66.67%,
		0.9927 70%,
		0.9891 73.33%,
		0.9876 76.67%,
		0.9876 80%,
		0.9888 83.33%,
		0.9905 86.67%,
		0.9926 90%,
		0.9946 93.33%,
		0.9965 96.67%,
		0.9982 100%
	);
}

/* Light: sun sits inside the pill on the right, thumb on the left. */
.is-light .sun {
	transform: translate(63px, 19px);
}

.is-light .moon {
	transform: translate(-6px, 118px);
}

.is-light .thumb {
	transform: translateX(0);
}

/* Dark: sun exits above, moon rises into the pill, thumb slides right. */
.is-dark .sun {
	transform: translate(63px, -81px);
}

.is-dark .moon {
	transform: translate(-6px, 18px);
}

.is-dark .thumb {
	transform: translateX(40px);
}

@media (prefers-reduced-motion: reduce) {
	.track,
	.sun,
	.moon,
	.thumb {
		transition: none;
	}
}
</style>
