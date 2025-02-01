#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 检查依赖项
if ! command -v inkscape &> /dev/null; then
    echo "错误：需要安装Inkscape" >&2
    echo "请执行安装命令："
    echo "  Mac: brew install inkscape"
    echo "  Linux: sudo apt-get install inkscape"
    exit 1
fi

# 添加文件存在性检查
if [ ! -f "${SCRIPT_DIR}/icon.svg" ]; then
    echo "错误：找不到源文件 ${SCRIPT_DIR}/icon.svg" >&2
    echo "当前目录文件列表："
    ls -l "${SCRIPT_DIR}"
    exit 1
fi

# 使用绝对路径处理文件
SVG_FILE="${SCRIPT_DIR}/icon.svg"
if ! inkscape "${SVG_FILE}" \
    --export-width=128 \
    --export-height=128 \
    --export-type=png \
    --export-filename="${SCRIPT_DIR}/icon128.png"; then
    echo "转换过程失败，请检查SVG文件路径" >&2
    exit 1
fi

# 验证文件生成
if [ -f "${SCRIPT_DIR}/icon128.png" ]; then
    echo "图标生成成功！"
    file "${SCRIPT_DIR}/icon128.png"
else
    echo "图标生成失败" >&2
    exit 1
fi

# 清理旧图标文件
clean_icons() {
    rm -f "${SCRIPT_DIR}"/icon*.png
    echo "已清理旧图标文件"
}

# 添加命令行参数支持
if [ "$1" == "--clean" ]; then
    clean_icons
    exit 0
fi

# 支持多尺寸生成（使用绝对路径）
declare -a sizes=("16" "32" "48" "128")
echo -e "\n开始生成多尺寸图标..."
for size in "${sizes[@]}"; do
    echo -n "生成 ${size}x${size}... "
    if ! inkscape "${SCRIPT_DIR}/icon.svg" \
        --export-width=$size \
        --export-height=$size \
        --export-type=png \
        --export-filename="${SCRIPT_DIR}/icon${size}.png"; then
        echo "❌"
    else
        echo "✅"
    fi
done

# 添加颜色参数校验
if ! grep -q '#4B5EE4' "${SVG_FILE}"; then
    echo "错误：SVG主色不符合品牌规范" >&2
    exit 1
fi

# 使用示例：
# ./create_icon.sh         # 正常生成
# ./create_icon.sh --clean # 清理旧文件

# 添加使用说明
echo -e "\n使用说明："
echo "  ./create_icon.sh       # 生成所有图标"
echo "  ./create_icon.sh --clean # 清理生成的图标文件" 
