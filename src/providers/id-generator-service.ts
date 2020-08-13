import {Injectable} from "@angular/core";
import bigInt from "big-integer";

/**
 * Created by xinli on 2017/10/30.
 */

class CustomUUID {
  // 基准时间
  private twepoch = 1288834974657; //Thu, 04 Nov 2010 01:42:54 GMT
  // 区域标志位数
  private static regionIdBits = 3;
  // 机器标识位数
  private static workerIdBits = 2;
  // 序列号识位数
  private static sequenceBits = 10;

  // 区域标志ID最大值
  private static maxRegionId = -1 ^ (-1 << CustomUUID.regionIdBits);
  // 机器ID最大值
  private static maxWorkerId = -1 ^ (-1 << CustomUUID.workerIdBits);
  // 序列号ID最大值
  private static sequenceMask = -1 ^ (-1 << CustomUUID.sequenceBits);

  // 机器ID偏左移10位
  private static workerIdShift = CustomUUID.sequenceBits;
  // 业务ID偏左移20位
  private static regionIdShift = CustomUUID.sequenceBits + CustomUUID.workerIdBits;
  // 时间毫秒左移23位
  private static timestampLeftShift = CustomUUID.sequenceBits + CustomUUID.workerIdBits + CustomUUID.regionIdBits;

  private static lastTimestamp = -1;

  private sequence = 0;
  private workerId;
  private regionId;

  constructor(workerId: number, regionId: number) {
    // 如果超出范围就抛出异常
    if (workerId > CustomUUID.maxWorkerId || workerId < 0) {
      throw new Error("worker Id can't be greater than %d or less than 0");
    }
    if (regionId > CustomUUID.maxRegionId || regionId < 0) {
      throw new Error("datacenter Id can't be greater than %d or less than 0");
    }

    this.workerId = workerId;
    this.regionId = regionId;
  }

  public generate() {
    return this.nextId(false, 0);
  }

  /**
   * 实际产生代码的
   *
   * @param isPadding
   * @param busId
   * @return
   */
  private nextId(isPadding: boolean, busId) {

    let timestamp = this.timeGen();
    let paddingnum = this.regionId;

    if (isPadding) {
      paddingnum = busId;
    }

    if (timestamp < CustomUUID.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id");
    }

    //如果上次生成时间和当前时间相同,在同一毫秒内
    if (CustomUUID.lastTimestamp == timestamp) {
      //sequence自增，因为sequence只有10bit，所以和sequenceMask相与一下，去掉高位
      this.sequence = (this.sequence + 1) & CustomUUID.sequenceMask;
      //判断是否溢出,也就是每毫秒内超过1024，当为1024时，与sequenceMask相与，sequence就等于0
      if (this.sequence == 0) {
        //自旋等待到下一毫秒
        timestamp = this.tilNextMilSecond(CustomUUID.lastTimestamp);
      }
    } else {
      // 如果和上次生成时间不同,重置sequence，就是下一毫秒开始，sequence计数重新从0开始累加,
      this.sequence = 0;
    }

    CustomUUID.lastTimestamp = timestamp;
    const tsPart = bigInt(timestamp - this.twepoch).shiftLeft(CustomUUID.timestampLeftShift);
    const paddingPart = bigInt(paddingnum).shiftLeft(CustomUUID.regionIdShift);
    const workerIdPart = bigInt(this.workerId).shiftLeft(CustomUUID.workerIdShift);
    return tsPart.or(paddingPart).or(workerIdPart).or(bigInt(this.sequence)).toJSNumber();
  }

  // 防止产生的时间比之前的时间还要小（由于NTP回拨等问题）,保持增量的趋势.
  private tilNextMilSecond(lastTimestamp) {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }

  // 获取当前的时间戳
  protected timeGen() {
    return new Date().getTime();
  }
}


@Injectable()
export class IdGeneratorService {

  private uuid: CustomUUID = new CustomUUID(3, 0);

  gen():number {
    return this.uuid.generate();
  }
}

