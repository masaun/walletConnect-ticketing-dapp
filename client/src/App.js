import React, { Component } from "react";
import { Button, Typography, Grid, TextField, Box, Card } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/styles';

// Import json file for artifact
import TicketFactory from "./contracts/TicketFactory.json";
import TicketMarket from "./contracts/TicketMarket.json";
import OceanToken from "./contracts/OceanToken.json";


import getWeb3 from "./utils/getWeb3";

import { theme } from './utils/theme';
import Header from './components/Header';

// WalletConnect
import WalletConnect from "@walletconnect/browser";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
//import WalletConnectInitialize from './components/walletConnect/WalletConnectInitialize.js';

import "./App.css";


const GAS = 500000;
const GAS_PRICE = "20000000000";


class App extends Component {
    constructor(props) {    
        super(props);

        this.state = { 
            web3: null, 
            accounts: null,
            ticket_factory: null
        };
    }

    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            // if (networkId !== 3) {
            //     throw new Error("Select the Ropsten network from your MetaMask plugin");
            // }
            if (networkId == 3) {
                console.log('=== Ropsten testnet ===');
            } else if (networkId == 4) {
                console.log('=== Rinkeby testnet ===');   
            }

            const deployedNetworkTicketFactory = TicketFactory.networks[networkId];

            const deployedNetworkTicketMarket = TicketMarket.networks[networkId];

            const deployedNetworkOceanToken = OceanToken.networks[networkId];


            const ticket_factory = new web3.eth.Contract(
                TicketFactory.abi,
                deployedNetworkTicketFactory && deployedNetworkTicketFactory.address,
            );

            const ticket_market = new web3.eth.Contract(
                TicketMarket.abi,
                deployedNetworkTicketMarket && deployedNetworkTicketMarket.address,
            );

            const ocean_token = new web3.eth.Contract(
                OceanToken.abi,
                deployedNetworkOceanToken && deployedNetworkOceanToken.address,
            );

            this.setState({ 
              web3: web3,
              accounts: accounts,
              ticket_factory: ticket_factory,
              ticket_market: ticket_market,
              ocean_token: ocean_token,
              ticket_market_contractAddr: deployedNetworkTicketMarket.address
            });

            window.ethereum.on('accountsChanged', async (accounts) => {
                const newAccounts = await web3.eth.getAccounts();
                this.setState({ accounts: newAccounts });
            });

            // Refresh on-chain data every 1 second
            const component = this;
            async function loopRefresh() {
                await component.refreshState();
                setTimeout(loopRefresh, 1000);
            }
            loopRefresh();

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }

        /***********************************************************************
         * WalletConnect / componentDidMount
         ***********************************************************************/
        // Create a walletConnector
        const walletConnector = new WalletConnect({
            bridge: "https://bridge.walletconnect.org" // Required
        });

        window.walletConnector = walletConnector;

        this.setState({ 
            walletConnector: walletConnector
        });
 
        // Log
        console.log('=== walletConnector ===', this.state.walletConnector);

        // Subscribe to connection events
        walletConnector.on("connect", (error, payload) => {
            if (error) {
                throw error;
            }

            // Close QR Code Modal
            WalletConnectQRCodeModal.close();

            // Get provided accounts and chainId
            const { accounts, chainId } = payload.params[0];
        });

        walletConnector.on("session_update", (error, payload) => {
          if (error) {
            throw error;
          }

          // Get updated accounts and chainId
          const { accounts, chainId } = payload.params[0];
        });

        walletConnector.on("disconnect", (error, payload) => {
          if (error) {
            throw error;
          }

          // Delete walletConnector
        });
    };



    /***********************************************************************
     * WalletConnect / function for call
     ***********************************************************************/
    walletConnect_getSignature = async () => {
        const { accounts, walletConnector } = this.state;

        // @dev - Assign value of constant temporarily
        const signatureOfwalletConnect = "c97ed927-7a0b-4ce1-8132-64a353bf9edc"

        this.setState({ 
            signature_of_walletConnect: signatureOfwalletConnect
        });
    }     

    walletConnect_sendTransaction = async () => {
        const { accounts, walletConnector } = this.state;
            // Draft transaction
        const tx = {
          from: accounts[0], // Required
          //from: "0xbc28Ea04101F03aA7a94C1379bc3AB32E65e62d3", // Required
          to: "0x89D24A7b4cCB1b6fAA2625Fe562bDd9A23260359", // Required (for non contract deployments)
          data: "0x", // Required
          gasPrice: "0x02540be400", // Optional
          gasLimit: "0x9c40", // Optional
          value: "0x00", // Optional
          nonce: "0x0114" // Optional
        };

        // Send transaction
        walletConnector
          .sendTransaction(tx)
          .then(result => {
            // Returns transaction id (hash)
            console.log(result);
          })
          .catch(error => {
            // Error returned when rejected
            console.error(error);
          });
    }




    /***********************************************************************
     * WalletConnect Ticket dApp
     ***********************************************************************/
    refreshState = async () => {
        const { accounts, ticket_factory } = this.state;

        this.setState({});
    }

    handleUpdateFundForm = (name, value) => {
        this.setState({ [name]: value });
    }

    handleFund = async (fundResultString) => {
        const { accounts, ticket_factory } = this.state;
    }

    handleTestFunc = async () => {
        const { accounts, ticket_factory } = this.state;
        try {
            const response = await ticket_factory.methods.testFunc().send({ from: accounts[0] });
            console.log("=== testFunc() ===", response)

            await this.setState({ message: "Success to create beneficiary" });
        }
        catch (error) {
            console.error(error);
            this.setState({ message: "Failed withdrawing" });
        }
    }


    _registerTicketPrice = async() => {
        const { accounts, ticket_factory } = this.state;
        let _adminAddr = accounts[0];
        let _sellingPriceOfTicket = 10000000000000

        const response = await ticket_factory.methods.registerTicketPrice(_adminAddr, _sellingPriceOfTicket).send({ from: accounts[0] });
        console.log("=== registerTicketPrice() ===", response)
    }

    _getTicketPrice = async() => {
        const { accounts, ticket_factory } = this.state;
        let _adminAddr = accounts[0];

        const response = await ticket_factory.methods.getTicketPrice(_adminAddr).call();
        console.log("=== getTicketPrice() ===", response)
    }


    totalSupply = async() => {
        const { accounts, ticket_factory } = this.state;

        const response = await ticket_factory.methods._totalSupply().call();
        console.log("=== _totalSupply() ===", response)
    }

    _mint = async () => {
        const { accounts, ticket_factory } = this.state;

        const response = await ticket_factory.methods.mint().send({ from: accounts[0] });
        console.log("=== mint() ===", response)
    }

    _ownerOfTicket = async () => {
        const { accounts, ticket_market } = this.state;
        let _ticketId = 8

        const response = await ticket_market.methods.ownerOfTicket(_ticketId).call();
        console.log("=== ownerOfTicket() ===", response)
    }

    _factoryMint = async () => {
        const { accounts, ticket_market } = this.state;
        let _callAddress = accounts[0]

        const response = await ticket_market.methods.factoryMint(_callAddress).send({ from: accounts[0] });
        console.log("=== factoryMint() ===", response)
    }

    _factoryTicketTransferFrom = async () => {
        const { accounts, ticket_market, ticket_factory, ticket_market_contractAddr } = this.state;
        let _from = accounts[0]                                               // From Address
        let _externalContract = ticket_market_contractAddr                    // External ContractAddress
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'                // To Address
        let _ticketId = 6

        // 2Step-Execution
        const response_1 = await ticket_factory.methods._transferTicketFrom(_from, _externalContract, _ticketId).send({ from: accounts[0] });
        const response_2 = await ticket_market.methods.factoryTransferFrom(_externalContract, _to, _ticketId).send({ from: accounts[0] });

        // Log
        console.log("=== _transferTicketFrom() ===", response_1)      
        console.log("=== factoryTransferFrom() ===", response_2)      
    }

    ticketTransferFrom = async () => {
        const { accounts, ticket_factory, ticket_market_contractAddr } = this.state;
        let _from = accounts[0]
        let _to = ticket_market_contractAddr
        let _ticketId = 4

        const response = await ticket_factory.methods._transferTicketFrom(_from, _to, _ticketId).send({ from: accounts[0] });
        console.log("=== _transferTicketFrom() ===", response)
    }



    totalSupplyERC20 = async () => {
        const { accounts, ticket_market } = this.state;
   
        const response = await ticket_market.methods.totalSupplyERC20().call()
        console.log("=== totalSupply() / ERC20 ===", response)
    }


    balanceOfERC20 = async () => {
        const { accounts, ticket_market } = this.state;
   
        const response = await ticket_market.methods.balanceOfERC20(accounts[0]).call()
        console.log("=== balanceOfERC20() ===", response)
    }


    _testTransferFrom = async () => {
        const { accounts, ticket_market, ocean_token, ticket_market_contractAddr } = this.state;
        let _from = accounts[0]                                               // From Address
        let _externalContract = ticket_market_contractAddr                    // External ContractAddress
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'                // To Address
        let _value = 10e12

        // 2Step-Execution
        const response_1 = await ocean_token.methods.transferFrom(_from, _externalContract, _value).send({ from: accounts[0] });
        const response_2 = await ticket_market.methods.testTransferFrom(_externalContract, _to, _value).send({ from: accounts[0] });

        // Log
        console.log("=== transferFrom() ===", response_1)
        console.log("=== testTransferFrom() ===", response_2)
    }

    _testTransfer = async () => {
        const { accounts, ticket_market, ocean_token, ticket_market_contractAddr } = this.state;  
        let _from = accounts[0]                                               // From Address
        let _externalContract = ticket_market_contractAddr                    // External ContractAddress
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'                // To Address
        let _value = 10e12

        // 2Step-Execution
        const response_1 = await ocean_token.methods.transfer(_externalContract, _value).send({ from: accounts[0] });
        const response_2 = await ticket_market.methods.testTransfer(_to, _value).send({ from: accounts[0] });

        // Log
        console.log("=== transfer() ===", response_1)
        console.log("=== testTransfer() ===", response_2)
    }


    _transferOceanToken = async () => {
        const { accounts, ocean_token } = this.state;
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'
        let _value = 10e12

        const response = await ocean_token.methods.transfer(_to, _value).send({ from: accounts[0] });
        console.log("=== transfer() ===", response)
    }


    _transferFromOceanToken = async () => {
        const { accounts, ocean_token } = this.state;
        let _from = accounts[0]
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'
        let _value = 10e12

        const response = await ocean_token.methods.transferFrom(_from, _to, _value).send({ from: accounts[0] });
        console.log("=== transferFrom() ===", response)
    }


    _buyTicket = async () => {
        const { accounts, ticket_market, ticket_factory, ocean_token, ticket_market_contractAddr, web3 } = this.state;  
        let _from = accounts[0]                                               // From Address
        let _externalContract = ticket_market_contractAddr                    // External ContractAddress
        let _to = '0x8Fc9d07b1B9542A71C4ba1702Cd230E160af6EB3'                // To Address
        //let _purchasePrice = 10e12
        let _adminAddr = accounts[0]
        let _buyer = accounts[0]

        const _totalSupply = await ticket_factory.methods.totalSupply().call();
        let _ticketId = _totalSupply - 1
        //let _ticketId = 2

        // Get price of selling ticket（ERC20）
        const ticketPrice = await ticket_factory.methods.getTicketPrice(_adminAddr).call();
        console.log("=== ticketPrice（buy with ERC20） ===", ticketPrice)      

        // Check balace of buyer（ETH）
        const _balanceOfBuyerOfETH = await web3.eth.getBalance(_buyer);
        let balanceOfBuyerOfETH = await web3.utils.fromWei(_balanceOfBuyerOfETH, 'ether');
        console.log("=== balanceOfBuyerOfETH ===", balanceOfBuyerOfETH)

        // Check balace of buyer（ERC20）
        const balanceOfBuyerOfERC20 = await ticket_market.methods.balanceOfERC20(_buyer).call();
        console.log("=== balanceOfBuyerOfERC20 ===", balanceOfBuyerOfERC20)

        // @notice - If balanceOfBuyerOfERC20 is greater than ticketPrice, it continue processing below
        if (balanceOfBuyerOfERC20 >= ticketPrice) {
            // 2Step-Execution
            const response_1 = await ocean_token.methods.transfer(_externalContract, ticketPrice).send({ from: accounts[0] });
            const response_2 = await ticket_market.methods.testTransfer(_to, ticketPrice).send({ from: accounts[0] });
            //const response_1 = await ocean_token.methods.transfer(_externalContract, _purchasePrice).send({ from: accounts[0] });
            //const response_2 = await ticket_market.methods.testTransfer(_to, _purchasePrice).send({ from: accounts[0] });

            // Log
            console.log("=== transfer() ===", response_1)
            console.log("=== testTransfer() ===", response_2)

            // 2Step-Execution
            const response_3 = await ticket_factory.methods._transferTicketFrom(_from, _externalContract, _ticketId).send({ from: accounts[0] });
            const response_4 = await ticket_market.methods.factoryTransferFrom(_externalContract, _to, _ticketId).send({ from: accounts[0] });

            // Log
            console.log("=== _transferTicketFrom() ===", response_3)      
            console.log("=== factoryTransferFrom() ===", response_4)  

            //const response = await ticket_market.methods.buyTicket(_ticketId).send({ from: accounts[0] });
            //console.log("=== buyTicket() ===", response)

            // @dev - issued signature to be bought ticket
            this.walletConnect_getSignature();
            let _walletConnectSignature = this.state.signature_of_walletConnect;
            const response_6 = await ticket_factory.methods.issueOnTicket(_ticketId, _walletConnectSignature).send({ from: accounts[0] });
            console.log("=== issueOnTicket() ===", response_6);

            let _issuedTxHash = response_6.events.IssueOnTicket.transactionHash;
            //let _issuedTxHash = ''
            const response_7 = await ticket_factory.methods.saveAddtionalIssuedInfo(_ticketId, _buyer, _issuedTxHash).send({ from: accounts[0] });
            console.log("=== saveAddtionalIssuedInfo() ===", response_6);
        }
    }


    _ticketStatus = async () => {
        const { accounts, ticket_factory } = this.state;
        const _totalSupply = await ticket_factory.methods.totalSupply().call();

        let ticketIdList = [];
        let isIssuedList = [];
        let ticketOwnerList = [];

        let t;
        for (t=0; t < _totalSupply; t++) {
            const response = await ticket_factory.methods.ticketStatus(t).call();
            console.log("=== ticketStatus() ===", response)

            ticketIdList.push(response.ticketId);
            isIssuedList.push(response.isIssued);
            ticketOwnerList.push(response.ticketOwner);
            this.setState({ 
                ticketIdList: ticketIdList,
                isIssuedList: isIssuedList,
                ticketOwnerList: ticketOwnerList,
            });
            console.log("=== ticketIdList ===", this.state.ticketIdList)
            console.log("=== isIssuedList ===", this.state.isIssuedList)
            console.log("=== ticketOwnerList ===", this.state.ticketOwnerList)
        }
    }


    _showTicket = async () => {
        const { accounts, ticket_factory } = this.state;
        let _ticketId = 0;

        const _totalSupply = await ticket_factory.methods.totalSupply().call();

        let t;
        for (t=0; t < _totalSupply; t++) {
            const response = await ticket_factory.methods.ticketStatus(t).call();
            console.log("=== ticketStatus() ===", response)

            if (accounts[0] == response.ticketOwner) {
                _ticketId = response.ticketId;
                this.setState({ showTicketId: _ticketId });
            }
        }

        const ticketDetailOfCallAddr = await ticket_factory.methods.ticketStatus(_ticketId).call();
        console.log("=== ticketDetailOfCallAddr ===", ticketDetailOfCallAddr)
        let ticketOwnerOfCallAddr = ticketDetailOfCallAddr.ticketOwner;
        let issuedTimestampOfCallAddr = ticketDetailOfCallAddr.issuedTimestamp;
        let issuedTxHashOfCallAddr = ticketDetailOfCallAddr.issuedTxHash;
        this.setState({ 
            ticketOwnerOfCallAddr: ticketOwnerOfCallAddr,
            issuedTimestampOfCallAddr: issuedTimestampOfCallAddr,
            issuedTxHashOfCallAddr: issuedTxHashOfCallAddr,
        });
    }

    render() {
        const { accounts } = this.state;

        if (!this.state.web3) {
            return (
                <ThemeProvider theme={theme}>
                    <div className="App">
                        <Header />

                        <Typography>
                            Loading Web3, accounts, and contract...
                        </Typography>
                    </div>
                </ThemeProvider>
            );
        }
        return (
            <ThemeProvider theme={theme}>
                <div className="App">
                    <Header />
                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        Ticket for attendence
                    </Typography>
                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {this.state.resultMessage}
                    </Typography>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Wallet address of attendence"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {`${accounts[0]}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Buy Event Ticket"} <br />
                                {"（The ticket price is 0.0001 OCEAN）"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Button variant="contained" color="secondary" onClick={() => this._buyTicket()}>
                                Buy Ticket
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Show Event Ticket"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Button variant="contained" color="secondary" onClick={() => this._showTicket()}>
                                Show Ticket
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Ticket ID which attendence bought"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {`${this.state.showTicketId}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Issued timestamp of ticket"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {`${this.state.issuedTimestampOfCallAddr}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {"Ticket ID of transaction hash which attendence bought"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h5">
                                {`${this.state.issuedTxHashOfCallAddr}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    <hr />

                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {"All of tickets status for admin"}
                    </Typography>

                    <Card>
                        <Grid container style={{ marginTop: 32 }}>
                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {"Ticket ID"}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {"Issued"}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {"Owner Address"}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid container style={{ marginTop: 32 }}>
                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {`${this.state.ticketIdList}`}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {`${this.state.isIssuedList}`}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="h5">
                                    {`${this.state.ticketOwnerList}`}
                                </Typography>
                            </Grid>
                        </Grid>

                        <Grid container style={{ marginTop: 32 }}>
                            <Grid item xs={4}>
                            </Grid>
                            <Grid item xs={4}>
                                <Button variant="contained" color="secondary" onClick={() => this._ticketStatus()}>
                                    Get Ticket Status
                                </Button>
                            </Grid>
                            <Grid item xs={4}>
                            </Grid>
                        </Grid>
                    </Card>

                    <hr />

                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {"Test of WalletConnect below"}
                    </Typography>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                           test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this.walletConnect_sendTransaction()}>
                               WalletConnect SendTransaction
                            </Button>
                        </Grid>
                    </Grid>

                    <hr />

                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {"Test of functions related to price below"}
                    </Typography>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                           test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this._registerTicketPrice()}>
                               Register Ticket Price
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                           test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this._getTicketPrice()}>
                                Get Ticket Price
                            </Button>
                        </Grid>
                    </Grid>

                    <hr />

                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {"Test of functions below"}
                    </Typography>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                           test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this.totalSupply()}>
                               Total Supply
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this.handleTestFunc()}>
                                Test Func
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" color="primary" onClick={() => this._mint()}>
                                Mint
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            <TextField
                                id="bet-amount"
                                className="input"
                                value={this.state.fundAmount}
                                onChange={e => this.handleUpdateFundForm('fundAmount', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._ownerOfTicket()}>
                                Owner of ticketId
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._factoryMint()}>
                              Factory Mint (ERC721)
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._factoryTicketTransferFrom()}>
                              Factory TransferFrom (ERC721)
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this.ticketTransferFrom()}>
                                Transfer TicketFrom（ERC721）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this.totalSupplyERC20()}>
                                Total Supply（ERC20）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this.balanceOfERC20()}>
                              Balance Of ERC20
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._testTransferFrom()}>
                                Test TransferFrom（ERC20）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._testTransfer()}>
                                Test Transfer（ERC20）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._transferOceanToken()}>
                               Transfer OceanToken（ERC20）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._transferOceanToken()}>
                               TransferFrom OceanToken（ERC20）
                          </Button>
                        </Grid>
                    </Grid>

                    <Grid container style={{ marginTop: 32 }}>
                        <Grid item xs={6}>
                            test
                        </Grid>
                        <Grid item xs={1}>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => this._buyTicket()}>
                                Buy Ticket
                          </Button>
                        </Grid>
                    </Grid>
                    <Typography variant="h5" style={{ marginTop: 32 }}>
                        {this.state.message}
                    </Typography>
                </div>
            </ThemeProvider>
        );
    }
}

export default App;
