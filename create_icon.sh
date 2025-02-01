#!/bin/bash

# 检查依赖项
if ! command -v inkscape &> /dev/null; then
    echo "错误：需要安装Inkscape" >&2
    echo "请执行安装命令："
    echo "  Mac: brew install inkscape"
    echo "  Linux: sudo apt-get install inkscape"
    exit 1
fi

# 创建图标目录
mkdir -p icons

# 使用Inkscape进行矢量转换（推荐）
if ! /Applications/Inkscape.app/Contents/MacOS/inkscape icons/icon128.svg \
    --export-width=128 \
    --export-height=128 \
    --export-type=png \
    --export-filename=icons/icon128.png; then
    echo "转换过程失败，请检查SVG文件路径" >&2
    exit 1
fi

# 验证文件生成
if [ -f icons/icon128.png ]; then
    echo "图标生成成功！"
    file icons/icon128.png  # 更通用的文件检查
else
    echo "图标生成失败，请检查Inkscape安装" >&2
    exit 1
fi

# 支持多尺寸生成
declare -a sizes=("16" "32" "48" "128")
for size in "${sizes[@]}"; do
    inkscape icons/icon.svg --export-width=$size --export-height=$size --export-type=png --export-filename=icons/icon${size}.png
done

# 添加颜色参数校验
if ! grep -q '#4B5EE4' icons/icon128.svg; then
    echo "错误：SVG主色不符合品牌规范" >&2
    exit 1
fi
