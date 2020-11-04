import crypto from 'crypto';

// for now , only unencrypted communication with the card is supported

const getTlvValueType = (tlvTagName) => {
  let tlvValueType = 'ByteArray';
  switch(tlvTagName) {
    case 'CardId':
    case 'Batch':
    case 'CrExKey ':
    case 'IssuerDataPublicKey':
      tlvValueType = 'HexString'; break;
    case 'ManufactureId':
    case 'Firmware':
    case 'IssuerId':
    case 'BlockchainId':
    case 'TokenSymbol':
    case 'TokenContractAddress':
      tlvValueType = 'Utf8String'; break;
    case 'CurveId':
      tlvValueType = 'EllipticCurve'; break;
    case 'PauseBeforePin2':
    case 'RemainingSignatures':
    case 'SignedHashes':
    case 'TokenDecimal':
    case 'Offset':
    case 'Size':
      tlvValueType = 'Uint16'; break;
    case 'Health':
    case 'FileIndex':
      tlvValueType = 'Uint8'; break;
    case 'MaxSignatures':
    case 'UserCounter':
    case 'UserProtectedCounter':
    case 'IssuerDataCounter':
      tlvValueType = 'Uint32'; break;
    case 'IsActivated':
    case 'TerminalIsLinked':
    case 'CreateWalletAtPersonalize':
      tlvValueType = 'BoolValue'; break;
    case 'ManufactureDateTime':
      tlvValueType = 'DateTime'; break;
    case 'ProductMask':
      tlvValueType = 'ProductMask'; break;
    case 'SettingsMask':
      tlvValueType = 'SettingsMask'; break;
    case 'Status':
      tlvValueType = 'CardStatus'; break;
    case 'SigningMethod':
      tlvValueType = 'SigningMethod'; break;
    case 'Mode':
      tlvValueType = 'IssuerDataMode'; break;
    case 'WriteFileMode':
      tlvValueType = 'FileDataMode'; break;
    case 'FileSettings':
      tlvValueType = 'FileSettings'; break;
  }

  return tlvValueType;
}

const getTlvTagName = (tlvCode) => {
  let tlvTagName= 'unknown ' + tlvCode;
  
  switch(tlvCode) {
    case 0x00: tlvTagName='Unknown'; break;
    case 0x01: tlvTagName='CardId'; break;
    case 0x02: tlvTagName='Status'; break;
    case 0x03: tlvTagName='CardPublicKey'; break;
    case 0x04: tlvTagName='CardSignature'; break;
    case 0x05: tlvTagName='CurveId'; break;
    case 0x06: tlvTagName='HashAlgID'; break;
    case 0x07: tlvTagName='SigningMethod'; break;
    case 0x08: tlvTagName='MaxSignatures'; break;
    case 0x09: tlvTagName='PauseBeforePin2'; break;
    case 0x0A: tlvTagName='SettingsMask'; break;
    case 0x0C: tlvTagName='CardData'; break;
    case 0x0D: tlvTagName='NdefData'; break;
    case 0x0E: tlvTagName='CreateWalletAtPersonalize'; break;
    case 0x0F: tlvTagName='Health'; break;
    case 0x10: tlvTagName='Pin'; break;
    case 0x11: tlvTagName='Pin2'; break;
    case 0x12: tlvTagName='NewPin'; break;
    case 0x13: tlvTagName='NewPin2'; break;
    case 0x14: tlvTagName='NewPinHash'; break;
    case 0x15: tlvTagName='NewPin2Hash'; break;
    case 0x16: tlvTagName='Challenge'; break;
    case 0x17: tlvTagName='Salt'; break;
    case 0x18: tlvTagName='ValidationCounter'; break;
    case 0x19: tlvTagName='Cvc'; break;
    case 0x1A: tlvTagName='SessionKeyA'; break;
    case 0x1B: tlvTagName='SessionKeyB'; break;
    case 0x1C: tlvTagName='Pause'; break;
    case 0x1E: tlvTagName='NewPin3'; break;
    case 0x1F: tlvTagName='CrExKey'; break;
    case 0x0B: tlvTagName='Uid'; break;
    case 0x20: tlvTagName='ManufactureId'; break;
    case 0x86: tlvTagName='ManufacturerSignature'; break;
    case 0x30: tlvTagName='IssuerDataPublicKey'; break;
    case 0x31: tlvTagName='IssuerTransactionPublicKey'; break;
    case 0x32: tlvTagName='IssuerData'; break;
    case 0x33: tlvTagName='IssuerDataSignature'; break;
    case 0x34: tlvTagName='IssuerTransactionSignature'; break;
    case 0x35: tlvTagName='IssuerDataCounter'; break;
    case 0x37: tlvTagName='AcquirerPublicKey'; break;
    case 0x25: tlvTagName='Size'; break;
    case 0x23: tlvTagName='Mode'; break;
    case 0x24: tlvTagName='Offset'; break;
    case 0x3A: tlvTagName='IsActivated'; break;
    case 0x3B: tlvTagName='ActivationSeed'; break;
    case 0x36: tlvTagName='ResetPin'; break;
    case 0x40: tlvTagName='CodePageAddress'; break;
    case 0x41: tlvTagName='CodePageCount'; break;
    case 0x42: tlvTagName='CodeHash'; break;
    case 0x50: tlvTagName='TransactionOutHash'; break;
    case 0x51: tlvTagName='TransactionOutHashSize'; break;
    case 0x52: tlvTagName='TransactionOutRaw'; break;
    case 0x60: tlvTagName='WalletPublicKey'; break;
    case 0x61: tlvTagName='Signature'; break;
    case 0x62: tlvTagName='RemainingSignatures'; break;
    case 0x63: tlvTagName='SignedHashes'; break;
    case 0x80: tlvTagName='Firmware'; break;
    case 0x81: tlvTagName='Batch'; break;
    case 0x82: tlvTagName='ManufactureDateTime'; break;
    case 0x83: tlvTagName='IssuerId'; break;
    case 0x84: tlvTagName='BlockchainId'; break;
    case 0x85: tlvTagName='ManufacturerPublicKey'; break;
    case 0x86: tlvTagName='CardIdManufacturerSignature'; break;
    case 0x8A: tlvTagName='ProductMask'; break;
    case 0x54: tlvTagName='PaymentFlowVersion'; break;
    case 0xA0: tlvTagName='TokenSymbol'; break;
    case 0xA1: tlvTagName='TokenContractAddress'; break;
    case 0xA2: tlvTagName='TokenDecimal'; break;
    case 0xC0: tlvTagName='Denomination'; break;
    case 0xC1: tlvTagName='ValidatedBalance'; break;
    case 0xC2: tlvTagName='LastSignDate'; break;
    case 0xC3: tlvTagName='DenominationText'; break;
    case 0x58: tlvTagName='TerminalIsLinked'; break;
    case 0x5C: tlvTagName='TerminalPublicKey'; break;
    case 0x57: tlvTagName='TerminalTransactionSignature'; break;
    case 0x2A: tlvTagName='UserData'; break;
    case 0x2B: tlvTagName='UserProtectedData'; break;
    case 0x2C: tlvTagName='UserCounter'; break;
    case 0x2D: tlvTagName='UserProtectedCounter'; break;
    case 0x23: tlvTagName='WriteFileMode'; break;
    case 0x26: tlvTagName='FileIndex'; break;
    case 0x27: tlvTagName='FileSettings'; break;
  }
  
  return tlvTagName;
}

const decodeTlvValue = (tlvValueType, data, tagName = "") => {
  let result='';
  // console.log("decodeTlvValue: %s - %s (%s) | %o", tagName, tlvValueType, data.length, data);
  switch(tlvValueType) {
    case 'HexString':
      result=data.toString('hex').toUpperCase(); break;
    // case 'HexStringToHash':
    //   result=data; break;
    case 'ByteArray':
      result=data; break;
    case 'Utf8String':
      result=data.toString('utf8'); break;
    case 'CardStatus':
    case 'SigningMethod':
    case 'Uint8':
      result=data.readUInt8(); break;
    case 'Uint16':
      result=data.readUInt16BE(); break;
    case 'SettingsMask':
    case 'Uint32':
      result=data.readUInt32BE(); break;
    case 'BoolValue':
      result=data!==0; break;
    //   result=data; break;
    case 'EllipticCurve':
    //   result=data; break;
      result=data.toString('utf8'); break;
    // case 'DateTime':
    //   result=data; break;
    // case 'ProductMask':
    //   result=data; break;
    //   result=data; break;
    // case 'SigningMethod':
    //   result=data; break;
    // case 'IssuerDataMode':
    //   result=data; break;
    // case 'FileDataMode':
    //   result=data; break;
    // case 'FileSettings':
    //   result=data; break;
  }
  
  // if(result==='') {
  //  console.log("decodeTlvValue: %s - %s (%s) | %o -> %s", tagName, tlvValueType, data.length, data, result);
  // }
  return result;
}

const decodeTLV = (data) => {
  let tlvData = {};
  let offset = 0;
  while(offset<data.length-2) { // last 2 bytes are status
    let code = data[offset++];
    let length = data[offset++]
    if(length===0xFF) {
      // 2 byte length indicated by 0xFF in first byte
      length = data[offset++]*256+data[offset++];
    }
    
    let tagName = getTlvTagName(code);
    let valueType = getTlvValueType(tagName);
    let tmpbuffer = Buffer.allocUnsafe(length);
    data.copy(tmpbuffer, 0, offset, offset + length);
    // console.log("decode next tlv %s @ %s [%s bytes] -> %o", code, offset, length, tmpbuffer)
    let value = decodeTlvValue(valueType, tmpbuffer, tagName);
//    console.log("decodeTLV from %s - id %s / %s (length %s) - %s", offset, tagName, valueType, length, JSON.stringify(value));
    
    offset+=length;
    tlvData[tagName]= value;
  }
  
  return tlvData;
}

export const readCard = async (reader) => {
  try {
    let hash = crypto
       .createHash('sha256')
       .update(Buffer.from('000000'))
       .digest();
    
    let tlv = Buffer.from([0x10, hash.length]);
    tlv = Buffer.concat([tlv, hash]);
    // console.log("got tlv: %o", tlv, tlv.length)

    let base = Buffer.from([
        0x00, // Class
        0xF2, // INS: READ_CARD command
        0x00, // P1:
        0x00, // P2
        tlv.length, // Le: Full Length of UID
      ]);
      
    let request = Buffer.concat([base, tlv]);
    let response = await reader.transmit(request, 2048);
    // console.log("get readCard response %s", JSON.stringify(response))
    
    let sw1  = response[response.length - 2]
    let sw2  = response[response.length - 1]
    
    let sw = 256 * sw1 + sw2;
    
    if(sw===0x9000) {
      console.log("card_read OK")
      
      // console.log("got data %o", response)
      
      let data = decodeTLV(response)
      return data;
      // console.log("read card data: %o", data);
    } else {
      console.log("card_read ERROR")
      return false;
    }
  } catch (err) {
    console.error('get_version error', err);
    return false;
  }
}


const leftPad = (val, size, ch) => {
  var result = String(val);
  if (!ch) {
    ch = ' ';
  }
  while (result.length < size) {
    result = ch + result;
  }
  return result;
};

export const signMessageRaw = async (
  reader,
  message,
  cid = 'BB03000000000004',
  pin1 = '000000',
  pin2 = '000'
) => {
  console.log("sign %s", message)
  // 91B4D142823F7D20C5F08DF69122DE43F35F057A988D9619F6D3138485C9A203
  const pin1Hex = crypto
    .createHash('sha256')
    .update(Buffer.from(pin1))
    .digest('hex');

  // 2AC9A6746ACA543AF8DFF39894CFE8173AFBA21EB01C6FAE33D52947222855EF
  const pin2Hex = crypto
    .createHash('sha256')
    .update(Buffer.from(pin2))
    .digest('hex');

  let messageLengthHex = leftPad((message.length / 2).toString(16), 4, '0');
  let Lc = leftPad((85 + message.length / 2).toString(16), 6, '0');
  let messageLengthHexNoPad = leftPad(
    (message.length / 2).toString(16),
    2,
    '0'
  );

  const packetString = [
    '00', // CLA
    'FB', // INS
    '00', // P1
    '00', // P2
    Lc, // Lc
    '0108' + cid,
    '1020' + pin1Hex,
    '1120' + pin2Hex,
//    '5101' + messageLengthHexNoPad,
    '52FF' + messageLengthHex + message,
  ]
    .join('')
    .toUpperCase();

  const packet = Buffer.from(packetString, 'hex');
  const response = await reader.transmit(packet, 8192);
  let tmp = response.readUInt16BE().toString(16);
  console.log("response %s", tmp);

  return response;
};