export type MissionPhotoSize = 'small' | 'medium' | 'large'

export interface MissionPhoto {
  imageUrl: string
  alt: string
  size: MissionPhotoSize
}

export interface MissionStatementBlockProps {
  blockType?: 'mission-statement'
  missionHeading: string
  missionBody: string
  visionHeading: string
  visionBody: string
  photos?: MissionPhoto[]
}