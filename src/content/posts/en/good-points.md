---
title: "Good Points: a family PWA for encouraging good behavior"
date: "2026-02-13"
author: "Xavier GUERET"
description: "How I built a reward points app for my kids using React, Firebase, and an offline-first PWA approach."
tags:
  - "React"
  - "TypeScript"
  - "Firebase"
  - "PWA"
  - "Tailwind CSS"
categories:
  - "github"
image: "/images/posts/goodpoints.png"
---

## Where the idea came from

At home, we had a classic problem: kids quickly forget the rules, parents aren't always aligned on rewards, and the good behavior chart on the fridge stops being updated after three days.

We wanted something simple: a system where kids see their points in real time, where both parents can add or check from their phone, and where rewards are clear and motivating. I looked for existing apps, but nothing quite matched what we had in mind. So I built one.

The result is [Good Points](https://goodpoints.kemax.ovh/) — an installable, offline-first PWA built with React and Firebase.

## The educational approach

At its core, the app is built on a simple idea: reward good behaviors rather than punish bad ones. No negative points, no taking away rewards. We encourage, we celebrate, we reward.

### The behavior contract

This is something we thought about quite a bit. The "super actions" in the app aren't meant to teach children new behaviors — they're there to reinforce behaviors they've already learned but don't yet apply consistently.

For example, a child who knows how to tidy their room but only does it when pushed is a good candidate for a "Tidy your room" super action. On the other hand, a child who's never learned how needs guidance first, before putting it in a contract.

The app includes a built-in guide for parents explaining how to write effective super actions: they should describe what the child **should** do (not what they shouldn't), be observable, and stay simple. "Speak calmly" rather than "Don't shout." We also recommend limiting a contract to three weeks — beyond that, either the behavior is acquired and can be removed, or the approach needs rethinking.

### Super actions

Each child can earn points by completing their super actions daily. By default, there are six: listening the first time, speaking calmly, being kind, accepting "no" without arguing, staying polite, keeping their room tidy. Parents customize the list, icons, and values based on what makes sense for their family.

An important point: super actions are assigned per child. Each child doesn't necessarily work on the same behaviors, and that's fine. The eldest might have "tidy your room" while the youngest works on "accept no without arguing."

### Challenges to overcome

For negative behaviors (shouting, talking back, mocking…), there are no negative points. Instead, there's a threshold system: under 10 occurrences per week, no penalty. Above that, consequences kick in. The counter resets every Monday.

The idea is to leave some room — kids aren't robots — while setting a clear limit. And when a child stays under the threshold, they unlock a weekly bonus. It turns managing difficult behaviors into a positive challenge rather than a threat.

### The rewards shop

Accumulated points are spent in a configurable shop: 30 extra minutes of screen time, a park outing, a small toy, family movie night… Each reward has a point cost, and the child can see what they can afford or how much they're missing.

This is where the educational dimension is most concrete. Children learn patience (saving for a big reward), responsibility (their actions have positive consequences), and autonomy (they choose their own goals).

### Communicating with the child

The app is just a tool — what matters most is the family conversation. The built-in guide emphasizes that rules should be clearly explained to the child, that both parents must be consistent with each other, and that the contract is built together. The child needs to understand why a behavior is expected, not just obey to earn points.

## The tech stack

The stack was driven by the use case: a family app used on phones, by multiple people, potentially without a connection.

- **React 18 + TypeScript** for the interface, with 19 custom hooks that cleanly separate responsibilities (auth, family, children, weekly tracking, rewards, purchases, badges…)
- **Firebase** as the backend: Firestore for the real-time database, Authentication for Google OAuth and email/password, and IndexedDB for offline persistence
- **Tailwind CSS** for styling, with a dynamic theme system (6 visual themes: Magical Purple, Ocean Blue, Sunset Orange, Nature Green, Bubblegum Pink, Camp Nature)
- **Vite** for the build, with `vite-plugin-pwa` and Workbox for the Service Worker
- **Framer Motion** for animations — confetti on reward purchases, floating +1 when adding a point, celebrations on badge unlocks

The app is installable on iOS and Android, works offline, and syncs in real time as soon as the connection comes back.

## Multi-family and security

The app isn't single-user. Multiple families can use it, each isolated in its own Firestore collection. Firebase Rules ensure that one family can never access another's data.

Onboarding works two ways:

- **Invitation code**: a unique 8-character code generated by the super admin, granting instant access
- **Access request**: the family submits a request, the super admin approves manually

Once the family is created, the first parent can invite the second one via a unique link. Limit: 2 parents and 5 children per family.

Parent mode gives access to the full configuration: children management, behaviors, per-child assignment, rewards, settings (theme, currency, shop hours, PIN), and a built-in FAQ. It's a trust-based system — children can see their balance and the shop, but configuration stays on the parent side.

## Gamification

Beyond points and the shop, the app includes a badge system to keep motivation going over time:

- **Perfect Week**: 3 perfect days in a week
- **Champion**: 5 perfect days
- **On Fire**: 3 consecutive positive weeks
- **Unstoppable**: 5 weeks in a row
- **Guardian Angel**: a week with no penalties at all
- **Points Master** and **Legend**: cumulative point milestones

Each unlocked badge gives an automatic bonus and triggers a celebration animation. The kids love it.

## Customization

Each family can adapt the app to how they work:

- **48 avatars** with diverse representation (different genders and skin tones)
- **Custom currency**: name and symbol from 29 options (stars, medals, diamonds…)
- **Shop hours**: ability to restrict when children can "shop"
- **Fully customizable** behaviors and rewards
- **Separate FAQs** for parent mode and child mode, with tone adapted to each audience

## Deployment

The app runs in production on Netlify with automatic deployment from GitHub. For development and testing, I use Docker with three profiles:

- **dev**: Node 20 Alpine with Vite hot reload
- **staging**: Nginx build for testing on my Proxmox VM
- **prod**: multi-stage build, final image around 25 MB

A Makefile simplifies everything: `make dev`, `make prod`, `make clean`.

## What it changed

Day to day, the impact is tangible. Conversations around behaviors are less confrontational because the rules are clear, written down, and the same for both parents. The kids no longer ask "when do we get a reward?" — they open the app and know exactly where they stand.

The most interesting part is what we didn't anticipate: the kids motivate each other. When one unlocks a badge, the other wants it too. When one saves up for the big reward, the other understands the point of not spending everything right away. The system naturally creates a positive dynamic among siblings.

It's also the kind of project that pushes you to care about details: offline has to actually work (not just in theory), animations have to be smooth even on an old phone, and the interface has to be usable by a 6-year-old.

The app is live at [goodpoints.kemax.ovh](https://goodpoints.kemax.ovh/).
