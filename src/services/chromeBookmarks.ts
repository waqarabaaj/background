import type { BookmarkFolder, FolderColor } from '../types';

const COLORS: FolderColor[] = ['purple', 'blue', 'emerald', 'amber', 'violet', 'fuchsia'];

export function isChromeBookmarksAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.bookmarks && chrome.bookmarks.getTree);
}

export async function fetchChromeBookmarkFolders(): Promise<BookmarkFolder[]> {
  if (!isChromeBookmarksAvailable()) return [];
  const tree = await chrome.bookmarks.getTree();
  const folders: BookmarkFolder[] = [];

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const directLinks = node.children
          .filter((c) => Boolean(c.url))
          .map((c) => ({
            id: `chrome_${c.id}`,
            title: c.title || c.url || 'Bookmark',
            url: c.url!,
          }));

        if (node.title && directLinks.length > 0) {
          folders.push({
            id: `chrome_folder_${node.id}`,
            name: node.title,
            color: COLORS[folders.length % COLORS.length],
            links: directLinks,
          });
        }
        walk(node.children);
      }
    }
  }

  walk(tree);
  return folders;
}
