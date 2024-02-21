import {FILE_MIME_MAPPING} from "../constants";
export const checkAttachmentTypeIsValid = (data) => {
  if (!data) return false;
  const types = data.split(',').map(type => type.trim()).filter(type => type !== "");
  return types.every(type => FILE_MIME_MAPPING.hasOwnProperty(type));
};
export const getValidAttachmentFileTypes = () => Object.keys(FILE_MIME_MAPPING)
