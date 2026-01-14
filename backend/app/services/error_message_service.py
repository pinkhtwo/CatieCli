"""
自定义错误消息服务

提供获取自定义错误消息的功能，供 proxy.py 调用。
"""
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import ErrorMessageConfig, SystemConfig


async def is_custom_error_messages_enabled(db: AsyncSession) -> bool:
    """检查自定义错误消息功能是否启用"""
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == "custom_error_messages_enabled")
    )
    config = result.scalar_one_or_none()
    return config is not None and config.value == "true"


async def get_custom_error_message(
    db: AsyncSession, 
    error_type: str, 
    error_text: str
) -> Optional[Dict]:
    """
    根据错误类型和原始错误文本获取自定义消息
    
    匹配逻辑：
    1. 优先按 priority 降序排列
    2. 关键词匹配（如果配置了 keyword）
    3. 错误类型匹配（如果配置了 error_type）
    
    Args:
        db: 数据库会话
        error_type: 错误类型（如 NETWORK_ERROR, RATE_LIMIT）
        error_text: 原始错误文本
        
    Returns:
        匹配的配置 {"id": int, "message": str} 或 None
    """
    # 检查功能是否启用
    if not await is_custom_error_messages_enabled(db):
        return None
    
    # 获取所有活跃的配置，按优先级排序
    result = await db.execute(
        select(ErrorMessageConfig)
        .where(ErrorMessageConfig.is_active == True)
        .order_by(ErrorMessageConfig.priority.desc())
    )
    configs = result.scalars().all()
    
    error_text_lower = (error_text or "").lower()
    
    for config in configs:
        # 1. 如果配置了关键词，检查关键词匹配
        if config.keyword:
            if config.keyword.lower() in error_text_lower:
                # 如果还配置了 error_type，也要匹配
                if config.error_type:
                    if config.error_type == error_type:
                        return {"id": config.id, "message": config.custom_message}
                else:
                    return {"id": config.id, "message": config.custom_message}
        
        # 2. 仅配置了 error_type（没有关键词）
        elif config.error_type and config.error_type == error_type:
            return {"id": config.id, "message": config.custom_message}
    
    return None


async def get_custom_error_message_sync(
    error_type: str, 
    error_text: str,
    configs: list
) -> Optional[str]:
    """
    同步版本的获取自定义消息（用于已经获取了配置列表的场景）
    
    Args:
        error_type: 错误类型
        error_text: 原始错误文本
        configs: 已获取的配置列表
        
    Returns:
        自定义消息或 None
    """
    error_text_lower = (error_text or "").lower()
    
    # 按优先级排序（假设调用方可能没排序）
    sorted_configs = sorted(configs, key=lambda x: x.priority, reverse=True)
    
    for config in sorted_configs:
        if not config.is_active:
            continue
            
        # 1. 关键词匹配
        if config.keyword:
            if config.keyword.lower() in error_text_lower:
                if config.error_type:
                    if config.error_type == error_type:
                        return config.custom_message
                else:
                    return config.custom_message
        
        # 2. 仅 error_type 匹配
        elif config.error_type and config.error_type == error_type:
            return config.custom_message
    
    return None
