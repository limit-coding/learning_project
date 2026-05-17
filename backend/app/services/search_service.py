"""搜索服务：爬取搜索结果"""
import re
import requests
from typing import List, Dict
from bs4 import BeautifulSoup


class SearchService:
    """搜索服务（使用 Bing）"""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def search(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """搜索并返回结果"""
        # 尝试 Bing
        results = self._search_bing(query, num_results)
        if results:
            return results

        # 备用：搜狗
        return self._search_sogou(query, num_results)

    def _search_bing(self, query: str, num_results: int) -> List[Dict[str, str]]:
        """使用 Bing 搜索"""
        try:
            url = "https://cn.bing.com/search"
            params = {"q": query}

            response = requests.get(
                url,
                params=params,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()

            return self._parse_bing_results(response.text, num_results)

        except Exception as e:
            print(f"Bing 搜索失败: {e}")
            return []

    def _parse_bing_results(self, html: str, num_results: int) -> List[Dict[str, str]]:
        """解析 Bing 搜索结果"""
        results = []
        soup = BeautifulSoup(html, "html.parser")

        # Bing 搜索结果在 class="b_algo" 的 li 中
        for item in soup.select(".b_algo"):
            if len(results) >= num_results:
                break

            # 提取标题
            title_elem = item.select_one("h2 a")
            if not title_elem:
                continue
            title = title_elem.get_text(strip=True)
            link = title_elem.get("href", "")

            # 提取摘要
            snippet_elem = item.select_one(".b_caption p, .b_algoSlug")
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

            if title and snippet:
                results.append({
                    "title": title,
                    "snippet": snippet[:500],
                    "link": link
                })

        return results

    def _search_sogou(self, query: str, num_results: int) -> List[Dict[str, str]]:
        """使用搜狗搜索（备用）"""
        try:
            url = "https://www.sogou.com/web"
            params = {"query": query}

            response = requests.get(
                url,
                params=params,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()

            return self._parse_sogou_results(response.text, num_results)

        except Exception as e:
            print(f"搜狗搜索失败: {e}")
            return []

    def _parse_sogou_results(self, html: str, num_results: int) -> List[Dict[str, str]]:
        """解析搜狗搜索结果"""
        results = []
        soup = BeautifulSoup(html, "html.parser")

        # 搜狗搜索结果在 class="vrwrap" 或 "rb" 的 div 中
        for item in soup.select(".vrwrap, .rb"):
            if len(results) >= num_results:
                break

            # 提取标题
            title_elem = item.select_one("h3 a")
            if not title_elem:
                continue
            title = title_elem.get_text(strip=True)
            link = title_elem.get("href", "")

            # 提取摘要
            snippet_elem = item.select_one(".star-wiki, .str-text-info, .space-txt")
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

            if title and snippet:
                results.append({
                    "title": title,
                    "snippet": snippet[:500],
                    "link": link
                })

        return results


# 单例
_search_service = None


def get_search_service() -> SearchService:
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
