import { client } from '@/src/lib/penumbra'
import { TransactionPlannerRequest, TransactionPlannerRequest_PositionClose, TransactionPlannerResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { CustodyService, ViewService } from '@penumbra-zone/protobuf';
import { positionIdFromBech32 } from '@penumbra-zone/bech32m/plpid';

export default function CloseLPButton(props:any) {
  console.log(props)
  async function planAndAuthTx() {
    return client.service(ViewService).transactionPlanner({
      source: {account: 0},
      positionCloses: [{
        positionId: positionIdFromBech32(props.data.Id)
      }]
    }).then(res => {
      console.log(res);
      client.service(CustodyService).authorize({plan: res.plan})
    })
  }

  return <button type="button" onClick={async() => {await planAndAuthTx()}}>Close</button>;
}