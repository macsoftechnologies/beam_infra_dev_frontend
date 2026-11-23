import APMTerminalPdf from "../assets/drawings/m3Infrastructure/plans/APM-Terminal/APM-Terminal.pdf";
import BADDPdf from "../assets/drawings/m3Infrastructure/plans/BA-DD/BA.pdf";
import ECJCP1Pdf from "../assets/drawings/m3Infrastructure/plans/EC/EC-JCP1.pdf";
import EHLakeEastPdf from "../assets/drawings/m3Infrastructure/plans/EHLakeEast/EHLakeEast.pdf";
import EHLakeWestPdf from "../assets/drawings/m3Infrastructure/plans/EHLakeWest/EHLakeWest.pdf";
import HovvejEastPdf from "../assets/drawings/m3Infrastructure/plans/HovvejEast/HovvejEast.pdf";
import HovvejWestPdf from "../assets/drawings/m3Infrastructure/plans/HovvejWest/HovvejWest.pdf";
import NNEastPdf from "../assets/drawings/m3Infrastructure/plans/NN-East/NN-East.pdf";
import PHusPdf from "../assets/drawings/m3Infrastructure/plans/P-hus/P-hus.pdf";
import RendsborgParkPdf from "../assets/drawings/m3Infrastructure/plans/RendsborgPark/RendsborgPark.pdf";
import PPVPdf from "../assets/drawings/m3Infrastructure/plans/PPV/PPV.pdf";
import TransferlinePdf from "../assets/drawings/m3Infrastructure/plans/Transferline/Transferline.pdf"

export const FLOOR_PDFS = {

  // Building 24 - PPV
  "24": {
    "PPV": PPVPdf,
  },

  // Building 23 - Transferline
  "23": {
    "Transferline": TransferlinePdf,
  },
  
  // Building 13 - APM Terminal
  "22": {
    "APM Terminal": APMTerminalPdf,
  },

  // Building 14 - EH Lake West
  "21": {
    "EH Lake West": EHLakeWestPdf,
  },

  // Building 15 - EH Lake East
  "20": {
    "EH Lake East": EHLakeEastPdf,
  },

  // Building 16 - Rendsborg Park
  "19": {
    "Rendsborg Park": RendsborgParkPdf,
  },

  // Building 17 - P-hus
  "18": {
    "P-hus Site-Plan": PHusPdf,
  },

  // Building 18 - NN East
  "17": {
    "NN East Site-Plan": NNEastPdf,
  },

  // Building 19 - HovvejWest
  "16": {
    "HovvejWest Zone 1 - Zone 2": HovvejWestPdf,
  },

  // Building 20 - HovvejEast
  "15": {
    "HovvejEast Zone 1 - Zone 2": HovvejEastPdf,
  },

  // Building 21 - EC-JCP1 Hallas Alle
  "14": {
    "EC-JCP1 Zone 1 - Zone 2": ECJCP1Pdf,
  },

  // Building 22 - BA-DD Hallas Alle
  "13": {
    "BA-DD Zone 1 - Zone 2": BADDPdf,
  },


};