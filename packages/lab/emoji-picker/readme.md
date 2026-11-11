# Emoji picker

An emoji browser you can search by name, keyword, slang or shortcode. Click an emoji to copy it, hold or right-click one to pick a skin tone, and the picker remembers your recents, tones and preferred size.

The grid is rendered at build time, so it shows up and scrolls before any JavaScript runs. Search loads in the background and builds its index in a web worker.

## Data

The emoji data is generated when you install dependencies and isn't committed. It merges [emojibase](https://emojibase.dev) (Unicode and CLDR names, keywords, groups, skin tones and shortcodes) with community keywords from [emojilib](https://github.com/muan/emojilib), then applies our own tweaks from `data/overrides.yaml`:

```yaml
🐐:
  add: [greatest of all time]
🔥:
  remove: [remove, tool]
```

After editing the overrides, regenerate with `pnpm -C packages/lab generate-catalog`.

## Credits

- [emojibase](https://emojibase.dev) by Miles Johnson (MIT)
- [emojilib](https://github.com/muan/emojilib) by Mu-An Chiou (MIT)
- [MiniSearch](https://lucaong.github.io/minisearch/) by Luca Ongaro (MIT)
- The check for which emoji a device can draw comes from [emoji-picker-element](https://github.com/nolanlawson/emoji-picker-element) by Nolan Lawson (Apache-2.0)
