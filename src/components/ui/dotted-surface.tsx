'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		particles: THREE.Points[];
		animationId: number;
	} | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const SEPARATION = 150;
		const AMOUNTX = 40;
		const AMOUNTY = 60;

		// Scene setup
		const scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

		const updateSize = () => {
			if (!containerRef.current) return;
			const width = containerRef.current.clientWidth;
			const height = containerRef.current.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		};

		const camera = new THREE.PerspectiveCamera(
			60,
			containerRef.current.clientWidth / containerRef.current.clientHeight,
			1,
			10000,
		);
		camera.position.set(0, 355, 1220);

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(scene.fog.color, 0);

		containerRef.current.appendChild(renderer.domElement);
		updateSize();

		// Create particles
		const particles: THREE.Points[] = [];
		const positions: number[] = [];
		const colors: number[] = [];

		// Create geometry for all particles
		const geometry = new THREE.BufferGeometry();

		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				const y = 0; // Will be animated
				const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

				positions.push(x, y, z);
				// Hardcode light colors for dark background (values between 0 and 1)
				colors.push(0.8, 0.8, 0.8);
			}
		}

		const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
		positionAttribute.setUsage(THREE.DynamicDrawUsage);
		geometry.setAttribute('position', positionAttribute);
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		// Create material
		const material = new THREE.PointsMaterial({
			size: 8,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true,
		});

		// Create points object
		const points = new THREE.Points(geometry, material);
		scene.add(points);

		let animationId: number;

		let mouseX = 0;
		let mouseY = 0;
		let windowHalfX = window.innerWidth / 2;
		let windowHalfY = window.innerHeight / 2;

		const onDocumentMouseMove = (event: MouseEvent) => {
			mouseX = event.clientX - windowHalfX;
			mouseY = event.clientY - windowHalfY;
		};
		document.addEventListener('mousemove', onDocumentMouseMove);

		// Animation function
		const animate = () => {
			animationId = requestAnimationFrame(animate);

			// Time-based animation so it moves at the same speed regardless of frame rate
			const time = performance.now() * 0.001; // Time in seconds
			const count = time * 3; // Adjust speed multiplier here

			const positionAttribute = geometry.attributes.position;
			const positions = positionAttribute.array as Float32Array;

			let i = 0;
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const index = i * 3;

					// Animate Y position with sine waves
					positions[index + 1] =
						Math.sin((ix + count) * 0.3) * 50 +
						Math.sin((iy + count) * 0.5) * 50;

					i++;
				}
			}

			positionAttribute.needsUpdate = true;

			// Update camera position based on mouse
			camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
			camera.position.y += (-mouseY * 1.5 + 355 - camera.position.y) * 0.05;
			camera.lookAt(scene.position);

			renderer.render(scene, camera);
		};

		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			updateSize();
			windowHalfX = window.innerWidth / 2;
			windowHalfY = window.innerHeight / 2;
		});
		resizeObserver.observe(containerRef.current);

		// Start animation
		animate();

		// Store references
		sceneRef.current = {
			scene,
			camera,
			renderer,
			particles: [points],
			animationId,
		};

		// Cleanup function
		return () => {
			resizeObserver.disconnect();
			document.removeEventListener('mousemove', onDocumentMouseMove);
			cancelAnimationFrame(animationId);

			if (sceneRef.current) {
				// Clean up Three.js objects
				sceneRef.current.scene.traverse((object) => {
					if (object instanceof THREE.Points) {
						object.geometry.dispose();
						if (Array.isArray(object.material)) {
							object.material.forEach((material) => material.dispose());
						} else {
							object.material.dispose();
						}
					}
				});

				sceneRef.current.renderer.dispose();

				if (containerRef.current && sceneRef.current.renderer.domElement) {
					containerRef.current.removeChild(
						sceneRef.current.renderer.domElement,
					);
				}
			}
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none absolute inset-0 -z-10', className)}
			{...props}
		/>
	);
}
