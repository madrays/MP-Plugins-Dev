"""
模块加载器模块
"""
import os
import importlib
import inspect
from typing import List, Type, Dict, Any

from app.log import logger
from plugins.nexusinvitee.sites import _ISiteHandler


class ModuleLoader:
    """
    模块加载器类
    """
    
    @staticmethod
    def load_site_handlers() -> List[Type[_ISiteHandler]]:
        """
        加载所有站点处理器类
        :return: 站点处理器类列表
        """
        handlers = []
        sites_dir = os.path.join(os.path.dirname(__file__), "sites")
        
        if not os.path.exists(sites_dir):
            logger.error("站点处理器目录不存在")
            return []
        
        # 遍历sites目录下的所有py文件
        for filename in os.listdir(sites_dir):
            if not filename.endswith(".py") or filename == "__init__.py":
                continue
            
            module_name = filename[:-3]  # 去掉.py后缀
            
            try:
                # 动态导入模块
                module = importlib.import_module(f"plugins.nexusinvitee.sites.{module_name}")
                
                # 查找模块中继承了_ISiteHandler的类
                for name, obj in inspect.getmembers(module):
                    if (inspect.isclass(obj) and 
                        issubclass(obj, _ISiteHandler) and 
                        obj != _ISiteHandler):
                        handlers.append(obj)
                        logger.info(f"加载站点处理器: {obj.__name__}")
            
            except Exception as e:
                logger.error(f"加载站点处理器模块 {module_name} 失败: {str(e)}")
        
        return handlers
    
    @staticmethod
    def get_handler_for_site(site_url: str, handlers: List[Type[_ISiteHandler]]) -> _ISiteHandler:
        """
        获取匹配站点的处理器实例
        :param site_url: 站点URL
        :param handlers: 处理器类列表
        :return: 处理器实例
        """
        for handler_class in handlers:
            if handler_class.match(site_url):
                return handler_class()
        
        # 如果没有找到匹配的处理器，返回None
        return None 