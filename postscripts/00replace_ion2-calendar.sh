#!/bin/bash
set -x
cd $INIT_CWD
# 执行 ionic build --prod --minifyjs --minifycss会报错
# Error: Metadata version mismatch for module /Users/n/projects/0fc/4crmpower-weixin/node_modules/ion2-calendar/dist/calendar.model.d.ts, found version 4, expected 3
# 解决方法：替换json中的 version:4，改为version:3 即可

rm -rf node_modules/ion2-calendar
cp -rf postscripts/ion2-calendar \
 node_modules/ion2-calendar
